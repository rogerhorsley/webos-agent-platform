import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { dbGetOne, dbUpdate } from '../db/index'
import { streamChat } from './claude'
import { execInWorkspace, runClaudeTask } from './sandbox'
import { appendChildTasks, createChildTask, runTeamOrchestration } from './teamOrchestrator'
import { agentMessageBus } from './messageBus'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let connection: IORedis | null = null
let taskQueue: Queue | null = null
let taskWorker: Worker | null = null

// Socket.IO instance for real-time updates (injected from index.ts)
let ioInstance: any = null

export function setSocketIO(io: any) {
  ioInstance = io
}

function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
    connection.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })
  }
  return connection
}

export function getTaskQueue(): Queue {
  if (!taskQueue) {
    taskQueue = new Queue('tasks', {
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  }
  return taskQueue
}

export async function enqueueTask(taskId: string): Promise<void> {
  const queue = getTaskQueue()
  await queue.add('execute', { taskId }, { jobId: taskId })
}

export function startWorker(): Worker {
  if (taskWorker) return taskWorker

  taskWorker = new Worker(
    'tasks',
    async (job: Job) => {
      const { taskId } = job.data
      const task = dbGetOne<any>('tasks', taskId)
      if (!task) throw new Error(`Task ${taskId} not found`)

      const agent = task.agentId ? dbGetOne<any>('agents', task.agentId) : null

      // Mark running
      dbUpdate('tasks', taskId, { status: 'running', startedAt: new Date().toISOString() })
      emitTaskEvent(taskId, 'task:status', { taskId, status: 'running', progress: 0 })

      try {
        let result: string
        const childTaskIds: string[] = []

        if (task.teamId) {
          const orchestration = await runTeamOrchestration({
            task,
            ioEmit: (event, payload) => emitTaskEvent(taskId, event, payload),
          })
          result = orchestration.result
          emitTaskEvent(taskId, 'team:done', {
            taskId,
            teamId: task.teamId,
            summary: orchestration.result.slice(0, 500),
            mode: orchestration.mode,
          })

          // Persist team member execution snapshots as child tasks.
          for (const step of orchestration.steps) {
            const childId = createChildTask(task, {
              name: `[${orchestration.mode}] ${step.agentName}`,
              agentId: step.agentId,
              teamId: task.teamId,
              input: { prompt: task.input.prompt },
            })
            childTaskIds.push(childId)
          }
        } else if (task.type === 'chat') {
          // Use Claude via streaming
          const chunks: string[] = []
          await streamChat(
            [{ role: 'user', content: task.input.prompt }],
            agent?.systemPrompt,
            agent?.config?.model,
            {
              onToken: (token) => {
                chunks.push(token)
                emitTaskEvent(taskId, 'task:token', { taskId, token })
              },
              onDone: (full) => { result = full },
              onError: (err) => { throw err },
            }
          )
          result = chunks.join('')
        } else if (task.type === 'workflow' && task.agentId) {
          // Run Claude Code in agent workspace
          const claudeResult = await runClaudeTask(task.agentId, task.input.prompt, { timeout: 120_000 })
          result = claudeResult.output
        } else {
          // Generic shell command execution
          const execResult = await execInWorkspace(
            task.agentId || 'shared',
            task.input.prompt,
            { timeout: 60_000 }
          )
          result = execResult.stdout || execResult.stderr
        }

        // Complete
        if (childTaskIds.length) {
          appendChildTasks(taskId, childTaskIds)
        }
        dbUpdate('tasks', taskId, {
          status: 'completed',
          output: { result, artifacts: [], logs: [] },
          progress: { current: 100, total: 100 },
          completedAt: new Date().toISOString(),
        })
        emitTaskEvent(taskId, 'task:status', { taskId, status: 'completed', progress: 100 })
        agentMessageBus.clearContext(taskId)

      } catch (err: any) {
        dbUpdate('tasks', taskId, {
          status: 'failed',
          output: { result: null, logs: [{ level: 'error', message: err.message }] },
          completedAt: new Date().toISOString(),
        })
        emitTaskEvent(taskId, 'task:status', { taskId, status: 'failed', error: err.message })
        agentMessageBus.clearContext(taskId)
        throw err
      }
    },
    {
      connection: getRedisConnection() as any,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3'),
    }
  )

  taskWorker.on('completed', (job) => {
    console.log(`[Worker] Task ${job.data.taskId} completed`)
  })

  taskWorker.on('failed', (job, err) => {
    console.error(`[Worker] Task ${job?.data?.taskId} failed:`, err.message)
  })

  console.log('[Worker] Task worker started')
  return taskWorker
}

function emitTaskEvent(taskId: string, event: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`task:${taskId}`).emit(event, data)
  }
}

export async function getQueueStats() {
  const queue = getTaskQueue()
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ])
  return { waiting, active, completed, failed }
}

export async function closeQueue() {
  if (taskWorker) await taskWorker.close()
  if (taskQueue) await taskQueue.close()
  if (connection) await connection.quit()
}

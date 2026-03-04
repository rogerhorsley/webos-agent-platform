import { CronExpressionParser } from 'cron-parser'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate } from '../db/index'
import { streamChat } from './claude'
import { runTeamOrchestration } from './teamOrchestrator'
import { sendToChannel } from './channelManager'

const POLL_INTERVAL = 30_000
let schedulerTimer: ReturnType<typeof setInterval> | null = null
let ioInstance: any = null

export function setSchedulerIO(io: any) {
  ioInstance = io
}

function computeNextRun(scheduleType: string, scheduleValue: string): string | null {
  const now = new Date()

  if (scheduleType === 'cron') {
    try {
      const interval = CronExpressionParser.parse(scheduleValue, { currentDate: now })
      return interval.next().toISOString()
    } catch {
      return null
    }
  }

  if (scheduleType === 'interval') {
    const seconds = parseInt(scheduleValue)
    if (isNaN(seconds) || seconds <= 0) return null
    return new Date(now.getTime() + seconds * 1000).toISOString()
  }

  if (scheduleType === 'once') {
    const target = new Date(scheduleValue)
    if (isNaN(target.getTime())) return null
    return target > now ? target.toISOString() : null
  }

  return null
}

async function executeDueTask(task: any): Promise<void> {
  const now = new Date().toISOString()
  const startTime = Date.now()

  dbUpdate('scheduled_tasks', task.id, { lastRun: now, updatedAt: now })

  if (ioInstance) {
    ioInstance.emit('scheduler:run', { taskId: task.id, status: 'running', startedAt: now })
  }

  try {
    let result: string

    if (task.teamId) {
      const pseudoTask = {
        id: `sched-${task.id}-${Date.now()}`,
        name: task.name,
        type: 'workflow',
        teamId: task.teamId,
        input: { prompt: task.prompt },
      }
      const orchestration = await runTeamOrchestration({ task: pseudoTask })
      result = orchestration.result
    } else if (task.agentId) {
      const agent = dbGetOne<any>('agents', task.agentId)
      result = await streamChat(
        [{ role: 'user', content: task.prompt }],
        agent?.systemPrompt,
        agent?.config?.model
      )
    } else {
      result = await streamChat([{ role: 'user', content: task.prompt }])
    }

    const duration = Date.now() - startTime
    const nextRun = task.scheduleType === 'once' ? null : computeNextRun(task.scheduleType, task.scheduleValue)

    dbUpdate('scheduled_tasks', task.id, {
      lastResult: result.slice(0, 5000),
      nextRun,
      status: task.scheduleType === 'once' ? 'completed' : 'active',
      updatedAt: new Date().toISOString(),
    })

    if (task.channelId && task.chatId && result) {
      try {
        const summary = result.length > 2000 ? result.slice(0, 2000) + '...' : result
        await sendToChannel(task.channelId, task.chatId, `[Scheduled: ${task.name}]\n\n${summary}`)
      } catch (err: any) {
        console.error(`[Scheduler] Failed to send result to channel: ${err.message}`)
      }
    }

    if (ioInstance) {
      ioInstance.emit('scheduler:run', {
        taskId: task.id,
        status: 'completed',
        duration,
        resultPreview: result.slice(0, 200),
      })
    }
  } catch (err: any) {
    const duration = Date.now() - startTime
    const nextRun = task.scheduleType === 'once' ? null : computeNextRun(task.scheduleType, task.scheduleValue)

    dbUpdate('scheduled_tasks', task.id, {
      lastResult: `ERROR: ${err.message}`,
      nextRun,
      updatedAt: new Date().toISOString(),
    })

    if (ioInstance) {
      ioInstance.emit('scheduler:run', { taskId: task.id, status: 'failed', duration, error: err.message })
    }
  }
}

async function pollDueTasks(): Promise<void> {
  try {
    const now = new Date().toISOString()
    const dueTasks = dbGetAll<any>('scheduled_tasks', 'status = ? AND nextRun <= ?', ['active', now])

    for (const task of dueTasks) {
      executeDueTask(task).catch(err => {
        console.error(`[Scheduler] Unhandled error for task ${task.id}: ${err.message}`)
      })
    }
  } catch (err: any) {
    console.error(`[Scheduler] Poll error: ${err.message}`)
  }
}

export function startScheduler(): void {
  if (schedulerTimer) return
  console.log('[Scheduler] Started (poll every 30s)')
  pollDueTasks()
  schedulerTimer = setInterval(pollDueTasks, POLL_INTERVAL)
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
}

export { computeNextRun }

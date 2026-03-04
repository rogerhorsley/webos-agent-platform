import Database from 'better-sqlite3'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data')
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = process.env.DATABASE_URL || path.join(DATA_DIR, 'nexusos.db')

const db: any = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'custom',
    systemPrompt TEXT,
    config      TEXT,
    skills      TEXT DEFAULT '[]',
    mcpServers  TEXT DEFAULT '[]',
    status      TEXT DEFAULT 'idle',
    workspace   TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT,
    type         TEXT NOT NULL DEFAULT 'chat',
    status       TEXT DEFAULT 'pending',
    priority     TEXT DEFAULT 'medium',
    agentId      TEXT,
    teamId       TEXT,
    input        TEXT NOT NULL DEFAULT '{}',
    output       TEXT,
    progress     TEXT DEFAULT '{"current":0,"total":100}',
    parentTaskId TEXT,
    childTaskIds TEXT DEFAULT '[]',
    createdAt    TEXT NOT NULL,
    startedAt    TEXT,
    completedAt  TEXT
  );

  CREATE TABLE IF NOT EXISTS agent_teams (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    description       TEXT,
    agentIds          TEXT DEFAULT '[]',
    coordinatorId     TEXT,
    communicationMode TEXT DEFAULT 'sequential',
    sharedContext     INTEGER DEFAULT 1,
    config            TEXT DEFAULT '{}',
    status            TEXT DEFAULT 'idle',
    createdAt         TEXT NOT NULL,
    updatedAt         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agent_messages (
    id         TEXT PRIMARY KEY,
    taskId     TEXT NOT NULL,
    senderId   TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    type       TEXT NOT NULL,
    payload    TEXT NOT NULL DEFAULT '{}',
    timestamp  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_task ON agent_messages(taskId);

  CREATE TABLE IF NOT EXISTS workflows (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    nodes       TEXT DEFAULT '[]',
    edges       TEXT DEFAULT '[]',
    variables   TEXT,
    status      TEXT DEFAULT 'draft',
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT,
    template    TEXT NOT NULL DEFAULT '{}',
    variables   TEXT DEFAULT '[]',
    version     TEXT DEFAULT '1.0.0',
    stats       TEXT DEFAULT '{"useCount":0,"avgRating":0}',
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skills (
    id          TEXT PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    version     TEXT NOT NULL DEFAULT '1.0.0',
    description TEXT,
    category    TEXT NOT NULL DEFAULT 'custom',
    author      TEXT NOT NULL DEFAULT 'system',
    installed   INTEGER DEFAULT 0,
    triggers    TEXT,
    content     TEXT,
    metadata    TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agent_templates (
    id          TEXT PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'custom',
    description TEXT,
    systemPrompt TEXT NOT NULL,
    config      TEXT DEFAULT '{}',
    category    TEXT DEFAULT 'general',
    author      TEXT DEFAULT 'system',
    icon        TEXT,
    tags        TEXT DEFAULT '[]',
    downloads   INTEGER DEFAULT 0,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skill_chains (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    skillIds    TEXT DEFAULT '[]',
    config      TEXT DEFAULT '{}',
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS channels (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    name        TEXT NOT NULL,
    config      TEXT DEFAULT '{}',
    status      TEXT DEFAULT 'disconnected',
    agentId     TEXT,
    teamId      TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS channel_messages (
    id          TEXT PRIMARY KEY,
    channelId   TEXT NOT NULL,
    chatId      TEXT NOT NULL,
    senderId    TEXT,
    senderName  TEXT,
    content     TEXT NOT NULL,
    direction   TEXT NOT NULL,
    metadata    TEXT DEFAULT '{}',
    timestamp   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_channel_msgs ON channel_messages(channelId, chatId, timestamp);

  CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    description   TEXT,
    agentId       TEXT,
    teamId        TEXT,
    channelId     TEXT,
    chatId        TEXT,
    prompt        TEXT NOT NULL,
    scheduleType  TEXT NOT NULL,
    scheduleValue TEXT NOT NULL,
    status        TEXT DEFAULT 'active',
    nextRun       TEXT,
    lastRun       TEXT,
    lastResult    TEXT,
    createdAt     TEXT NOT NULL,
    updatedAt     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    content     TEXT DEFAULT '{}',
    agentId     TEXT,
    tags        TEXT DEFAULT '[]',
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mail_accounts (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    name        TEXT,
    imapHost    TEXT NOT NULL,
    imapPort    INTEGER DEFAULT 993,
    smtpHost    TEXT NOT NULL,
    smtpPort    INTEGER DEFAULT 587,
    username    TEXT NOT NULL,
    password    TEXT NOT NULL,
    status      TEXT DEFAULT 'disconnected',
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mail_messages (
    id          TEXT PRIMARY KEY,
    accountId   TEXT NOT NULL,
    folder      TEXT DEFAULT 'INBOX',
    fromAddr    TEXT,
    fromName    TEXT,
    toAddr      TEXT,
    subject     TEXT,
    body        TEXT,
    htmlBody    TEXT,
    isRead      INTEGER DEFAULT 0,
    date        TEXT,
    uid         INTEGER,
    createdAt   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_mail_msgs ON mail_messages(accountId, folder, date);

  CREATE TABLE IF NOT EXISTS mcp_servers (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    transport   TEXT NOT NULL DEFAULT 'stdio',
    command     TEXT,
    url         TEXT,
    env         TEXT,
    tools       TEXT DEFAULT '[]',
    resources   TEXT DEFAULT '[]',
    prompts     TEXT DEFAULT '[]',
    status      TEXT DEFAULT 'inactive',
    healthCheck TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );
`)

// ─────────────────────────────────────────────
// Seed default skills (idempotent)
// ─────────────────────────────────────────────
const seedSkills = [
  { id: 'skill-web-search', slug: 'web-search', name: 'Web Search', description: 'Search the web for real-time information', category: 'research', content: JSON.stringify({ systemPrompt: 'You are a web search specialist.', instructions: 'Search the web and summarize findings.' }), triggers: JSON.stringify({ keywords: ['search', 'find', 'lookup', 'google'] }) },
  { id: 'skill-code-review', slug: 'code-review', name: 'Code Review', description: 'Review code for best practices and bugs', category: 'development', content: JSON.stringify({ systemPrompt: 'You are a code reviewer.', instructions: 'Review code for quality, bugs, and best practices.' }), triggers: JSON.stringify({ keywords: ['review', 'audit', 'check code'] }) },
  { id: 'skill-document-writer', slug: 'document-writer', name: 'Document Writer', description: 'Create professional documents and reports', category: 'writing', content: JSON.stringify({ systemPrompt: 'You are a technical writer.', instructions: 'Write clear, structured documents.' }), triggers: JSON.stringify({ keywords: ['write', 'document', 'report'] }) },
  { id: 'skill-data-analyst', slug: 'data-analyst', name: 'Data Analyst', description: 'Analyze datasets and generate insights', category: 'data', content: JSON.stringify({ systemPrompt: 'You are a data analyst.', instructions: 'Analyze data and produce visualizations.' }), triggers: JSON.stringify({ keywords: ['analyze', 'data', 'chart', 'statistics'] }) },
  { id: 'skill-api-caller', slug: 'api-caller', name: 'API Caller', description: 'Call external APIs and process results', category: 'automation', content: JSON.stringify({ systemPrompt: 'You are an API integration specialist.', instructions: 'Make API calls and transform responses.' }), triggers: JSON.stringify({ keywords: ['api', 'fetch', 'request', 'endpoint'] }) },
  { id: 'skill-image-gen', slug: 'image-gen', name: 'Image Generation', description: 'Generate images from text descriptions', category: 'design', content: JSON.stringify({ systemPrompt: 'You are an image generation specialist.', instructions: 'Create detailed image prompts.' }), triggers: JSON.stringify({ keywords: ['image', 'picture', 'generate', 'draw'] }) },
  { id: 'skill-summarizer', slug: 'summarizer', name: 'Summarizer', description: 'Summarize long texts, articles, and documents', category: 'writing', content: JSON.stringify({ systemPrompt: 'You are a summarization expert.', instructions: 'Produce concise summaries preserving key points.' }), triggers: JSON.stringify({ keywords: ['summarize', 'tldr', 'brief'] }) },
  { id: 'skill-translator', slug: 'translator', name: 'Translator', description: 'Translate text between languages', category: 'communication', content: JSON.stringify({ systemPrompt: 'You are a professional translator.', instructions: 'Translate accurately while preserving tone and context.' }), triggers: JSON.stringify({ keywords: ['translate', 'language', 'localize'] }) },
  { id: 'skill-sql-query', slug: 'sql-query', name: 'SQL Query Builder', description: 'Generate and optimize SQL queries', category: 'data', content: JSON.stringify({ systemPrompt: 'You are a SQL expert.', instructions: 'Write optimized SQL queries from natural language.' }), triggers: JSON.stringify({ keywords: ['sql', 'query', 'database', 'select'] }) },
  { id: 'skill-email-composer', slug: 'email-composer', name: 'Email Composer', description: 'Draft professional emails', category: 'communication', content: JSON.stringify({ systemPrompt: 'You are an email writing specialist.', instructions: 'Compose clear, professional emails.' }), triggers: JSON.stringify({ keywords: ['email', 'mail', 'compose', 'draft'] }) },
  { id: 'skill-unit-test', slug: 'unit-test', name: 'Unit Test Generator', description: 'Generate unit tests for code', category: 'development', content: JSON.stringify({ systemPrompt: 'You are a testing specialist.', instructions: 'Write comprehensive unit tests.' }), triggers: JSON.stringify({ keywords: ['test', 'unit test', 'jest', 'vitest'] }) },
  { id: 'skill-refactor', slug: 'refactor', name: 'Code Refactorer', description: 'Refactor code for readability and performance', category: 'development', content: JSON.stringify({ systemPrompt: 'You are a refactoring expert.', instructions: 'Improve code structure without changing behavior.' }), triggers: JSON.stringify({ keywords: ['refactor', 'clean', 'improve', 'optimize'] }) },
  { id: 'skill-csv-processor', slug: 'csv-processor', name: 'CSV Processor', description: 'Parse, transform, and analyze CSV data', category: 'data', content: JSON.stringify({ systemPrompt: 'You are a data processing specialist.', instructions: 'Process CSV files and extract insights.' }), triggers: JSON.stringify({ keywords: ['csv', 'spreadsheet', 'parse', 'table'] }) },
  { id: 'skill-regex-builder', slug: 'regex-builder', name: 'Regex Builder', description: 'Build and explain regular expressions', category: 'development', content: JSON.stringify({ systemPrompt: 'You are a regex expert.', instructions: 'Create and explain regular expressions.' }), triggers: JSON.stringify({ keywords: ['regex', 'pattern', 'match', 'regular expression'] }) },
  { id: 'skill-git-helper', slug: 'git-helper', name: 'Git Helper', description: 'Help with git commands and workflows', category: 'development', content: JSON.stringify({ systemPrompt: 'You are a git expert.', instructions: 'Help with git operations and resolve conflicts.' }), triggers: JSON.stringify({ keywords: ['git', 'commit', 'merge', 'branch', 'rebase'] }) },
  { id: 'skill-shell-expert', slug: 'shell-expert', name: 'Shell Expert', description: 'Generate and explain shell commands', category: 'automation', content: JSON.stringify({ systemPrompt: 'You are a shell scripting expert.', instructions: 'Write shell commands and scripts.' }), triggers: JSON.stringify({ keywords: ['shell', 'bash', 'command', 'terminal', 'script'] }) },
]

const insertSkill = db.prepare(`
  INSERT OR IGNORE INTO skills (id, slug, name, description, category, author, version, content, triggers, createdAt, updatedAt)
  VALUES (@id, @slug, @name, @description, @category, 'system', '1.0.0', @content, @triggers, @now, @now)
`)
const now = new Date().toISOString()
for (const s of seedSkills) {
  insertSkill.run({ ...s, content: s.content || null, triggers: s.triggers || null, now })
}

// Seed built-in coordinator agent: NexusCore (idempotent)
db.prepare(`
  INSERT OR IGNORE INTO agents (
    id, name, role, systemPrompt, config, skills, mcpServers, status, workspace, createdAt, updatedAt
  ) VALUES (
    @id, @name, @role, @systemPrompt, @config, '[]', '[]', 'idle', NULL, @now, @now
  )
`).run({
  id: 'nexus-core',
  name: 'NexusCore',
  role: 'coordinator',
  systemPrompt: 'You are NexusCore, the built-in chief assistant. Interpret user requests, choose direct reply or dispatch to agents/teams, and explain decisions clearly.',
  config: JSON.stringify({
    model: 'anthropic/claude-sonnet-4-5',
    temperature: 0.4,
    maxTokens: 4096,
  }),
  now,
})

// Seed agent templates (marketplace)
const seedTemplates = [
  { slug: 'writing-assistant', name: '写作助手', role: 'custom', category: 'writing', description: 'Professional writing assistant for articles, blogs, and creative content', systemPrompt: 'You are a professional writer. Help users craft compelling content with clear structure, engaging tone, and proper grammar. Adapt your style to the requested format (blog, article, essay, copy).', tags: ['writing', 'content', 'blog'] },
  { slug: 'data-analyst', name: '数据分析师', role: 'researcher', category: 'data', description: 'Analyze datasets, generate insights, and create visualizations', systemPrompt: 'You are a senior data analyst. Analyze data thoroughly, identify patterns and anomalies, suggest visualizations, and provide actionable insights. Use statistical methods when appropriate.', tags: ['data', 'analytics', 'statistics'] },
  { slug: 'code-reviewer', name: '代码审查员', role: 'developer', category: 'development', description: 'Review code for quality, security, and best practices', systemPrompt: 'You are a senior code reviewer. Examine code for bugs, security vulnerabilities, performance issues, and adherence to best practices. Provide specific, actionable feedback with code examples.', tags: ['code', 'review', 'quality'] },
  { slug: 'product-manager', name: '产品经理', role: 'custom', category: 'business', description: 'Help with product strategy, PRDs, and feature prioritization', systemPrompt: 'You are an experienced product manager. Help define product strategy, write PRDs, prioritize features using frameworks like RICE, and create user stories. Think from both user and business perspectives.', tags: ['product', 'strategy', 'prd'] },
  { slug: 'ui-designer', name: 'UI 设计师', role: 'designer', category: 'design', description: 'Design user interfaces with modern aesthetics and great UX', systemPrompt: 'You are a senior UI/UX designer. Create beautiful, accessible, and user-friendly interfaces. Follow modern design principles, suggest color palettes, typography, and layout patterns. Provide CSS/Tailwind implementations.', tags: ['design', 'ui', 'ux', 'css'] },
  { slug: 'researcher', name: '研究员', role: 'researcher', category: 'research', description: 'Deep research on any topic with structured analysis', systemPrompt: 'You are a thorough researcher. Investigate topics deeply, cross-reference information, identify key findings, and present structured analyses with citations and confidence levels.', tags: ['research', 'analysis', 'investigation'] },
  { slug: 'translator', name: '翻译官', role: 'custom', category: 'communication', description: 'Accurate translation between languages preserving tone and context', systemPrompt: 'You are a professional translator fluent in all major languages. Translate accurately while preserving tone, cultural nuances, and context. Handle technical terminology and idiomatic expressions appropriately.', tags: ['translate', 'language', 'localization'] },
  { slug: 'seo-expert', name: 'SEO 专家', role: 'custom', category: 'marketing', description: 'Optimize content for search engines and improve rankings', systemPrompt: 'You are an SEO specialist. Analyze content for search optimization, suggest keywords, meta descriptions, heading structures, and internal linking strategies. Stay current with search algorithm best practices.', tags: ['seo', 'marketing', 'search'] },
  { slug: 'test-engineer', name: '测试工程师', role: 'developer', category: 'development', description: 'Write comprehensive tests and testing strategies', systemPrompt: 'You are a QA engineer specializing in automated testing. Write unit tests, integration tests, and e2e tests. Design test strategies, identify edge cases, and ensure comprehensive coverage. Use modern testing frameworks.', tags: ['testing', 'qa', 'automation'] },
  { slug: 'devops-engineer', name: 'DevOps 工程师', role: 'developer', category: 'infrastructure', description: 'CI/CD pipelines, Docker, Kubernetes, and cloud infrastructure', systemPrompt: 'You are a DevOps engineer. Help with CI/CD pipelines, containerization, orchestration, monitoring, and cloud infrastructure. Write Dockerfiles, GitHub Actions, and Kubernetes manifests.', tags: ['devops', 'docker', 'ci-cd', 'cloud'] },
  { slug: 'api-architect', name: 'API 架构师', role: 'developer', category: 'development', description: 'Design RESTful and GraphQL APIs with best practices', systemPrompt: 'You are an API architect. Design clean, scalable APIs following REST or GraphQL best practices. Define schemas, authentication patterns, rate limiting, versioning, and error handling strategies.', tags: ['api', 'rest', 'graphql', 'architecture'] },
  { slug: 'security-auditor', name: '安全审计员', role: 'developer', category: 'security', description: 'Identify security vulnerabilities and suggest mitigations', systemPrompt: 'You are a security specialist. Audit code and systems for vulnerabilities (XSS, CSRF, SQL injection, etc.), suggest mitigations, and recommend security best practices. Follow OWASP guidelines.', tags: ['security', 'audit', 'vulnerability'] },
]

const insertTemplate = db.prepare(`
  INSERT OR IGNORE INTO agent_templates (id, slug, name, role, description, systemPrompt, config, category, author, tags, downloads, createdAt, updatedAt)
  VALUES (@id, @slug, @name, @role, @description, @systemPrompt, @config, @category, 'system', @tags, 0, @now, @now)
`)
for (const t of seedTemplates) {
  insertTemplate.run({
    id: `tpl-${t.slug}`,
    slug: t.slug,
    name: t.name,
    role: t.role,
    description: t.description,
    systemPrompt: t.systemPrompt,
    config: JSON.stringify({ model: 'anthropic/claude-sonnet-4-5', temperature: 0.7, maxTokens: 4096 }),
    category: t.category,
    tags: JSON.stringify(t.tags),
    now,
  })
}

// ─────────────────────────────────────────────
// Generic helpers (JSON columns auto-parsed)
// ─────────────────────────────────────────────
const JSON_COLS: Record<string, string[]> = {
  agents:          ['config', 'skills', 'mcpServers', 'workspace'],
  agent_teams:     ['agentIds', 'config'],
  agent_templates: ['config', 'tags'],
  agent_messages:  ['payload'],
  tasks:           ['input', 'output', 'progress', 'childTaskIds'],
  workflows:       ['nodes', 'edges', 'variables'],
  prompts:         ['template', 'variables', 'stats'],
  skills:          ['triggers', 'content', 'metadata'],
  skill_chains:    ['skillIds', 'config'],
  channels:        ['config'],
  channel_messages:['metadata'],
  notes:           ['content', 'tags'],
  mcp_servers:     ['env', 'tools', 'resources', 'prompts', 'healthCheck'],
}

function parseRow(table: string, row: any): any {
  if (!row) return row
  const cols = JSON_COLS[table] || []
  const parsed = { ...row }
  for (const col of cols) {
    if (parsed[col] && typeof parsed[col] === 'string') {
      try { parsed[col] = JSON.parse(parsed[col]) } catch {}
    }
  }
  return parsed
}

function serializeRow(table: string, data: Record<string, any>): Record<string, any> {
  const cols = JSON_COLS[table] || []
  const serialized = { ...data }
  for (const col of cols) {
    if (serialized[col] !== undefined && typeof serialized[col] !== 'string') {
      serialized[col] = JSON.stringify(serialized[col])
    }
  }
  for (const [key, val] of Object.entries(serialized)) {
    if (typeof val === 'boolean') serialized[key] = val ? 1 : 0
  }
  return serialized
}

export function dbGetAll<T = any>(table: string, where?: string, params?: any[]): T[] {
  const sql = `SELECT * FROM ${table}${where ? ` WHERE ${where}` : ''} ORDER BY createdAt DESC`
  const rows = params ? (db.prepare(sql).all(...params) as any[]) : (db.prepare(sql).all() as any[])
  return rows.map(r => parseRow(table, r)) as T[]
}

export function dbGetOne<T = any>(table: string, id: string, idCol = 'id'): T | undefined {
  const row = db.prepare(`SELECT * FROM ${table} WHERE ${idCol} = ?`).get(id) as any
  return parseRow(table, row) as T | undefined
}

export function dbInsert(table: string, data: Record<string, any>): void {
  const s = serializeRow(table, data)
  const cols = Object.keys(s)
  const ph = cols.map(() => '?').join(', ')
  db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${ph})`).run(...Object.values(s))
}

export function dbUpdate(table: string, id: string, data: Record<string, any>): void {
  const s = serializeRow(table, data)
  const sets = Object.keys(s).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).run(...Object.values(s), id)
}

export function dbDelete(table: string, id: string): void {
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
}

export function dbExists(table: string, id: string): boolean {
  const row = db.prepare(`SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`).get(id)
  return !!row
}

export function dbCount(table: string, where?: string, params?: any[]): number {
  const sql = `SELECT COUNT(*) as n FROM ${table}${where ? ` WHERE ${where}` : ''}`
  const row = params ? (db.prepare(sql).get(...params) as any) : (db.prepare(sql).get() as any)
  return row?.n ?? 0
}

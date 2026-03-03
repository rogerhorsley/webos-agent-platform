import Database from 'better-sqlite3'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data')
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = process.env.DATABASE_URL || path.join(DATA_DIR, 'nexusos.db')

export const db = new Database(DB_PATH)
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
  { id: 'skill-web-search', slug: 'web-search', name: 'Web Search', description: 'Search the web for information', category: 'research' },
  { id: 'skill-code-review', slug: 'code-review', name: 'Code Review', description: 'Review code for best practices', category: 'development' },
  { id: 'skill-document-writer', slug: 'document-writer', name: 'Document Writer', description: 'Create professional documents', category: 'writing' },
  { id: 'skill-data-analyst', slug: 'data-analyst', name: 'Data Analyst', description: 'Analyze and visualize data', category: 'data' },
  { id: 'skill-api-caller', slug: 'api-caller', name: 'API Caller', description: 'Call external APIs and process results', category: 'automation' },
  { id: 'skill-image-gen', slug: 'image-gen', name: 'Image Generation', description: 'Generate images from descriptions', category: 'design' },
]

const insertSkill = db.prepare(`
  INSERT OR IGNORE INTO skills (id, slug, name, description, category, author, version, createdAt, updatedAt)
  VALUES (@id, @slug, @name, @description, @category, 'system', '1.0.0', @now, @now)
`)
const now = new Date().toISOString()
for (const s of seedSkills) {
  insertSkill.run({ ...s, now })
}

// ─────────────────────────────────────────────
// Generic helpers (JSON columns auto-parsed)
// ─────────────────────────────────────────────
const JSON_COLS: Record<string, string[]> = {
  agents:      ['config', 'skills', 'mcpServers', 'workspace'],
  tasks:       ['input', 'output', 'progress', 'childTaskIds'],
  workflows:   ['nodes', 'edges', 'variables'],
  prompts:     ['template', 'variables', 'stats'],
  skills:      ['triggers', 'content', 'metadata'],
  mcp_servers: ['env', 'tools', 'resources', 'prompts', 'healthCheck'],
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

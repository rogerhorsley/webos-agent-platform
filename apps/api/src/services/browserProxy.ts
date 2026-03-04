import type { Browser, Page } from 'puppeteer-core'

interface BrowserSession {
  id: string
  page: Page
  browser: Browser
  lastActivity: number
}

const sessions = new Map<string, BrowserSession>()
const SESSION_TIMEOUT = 10 * 60 * 1000

async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import('puppeteer-core')
  const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium' || '/usr/bin/chromium-browser' || '/usr/bin/google-chrome'

  return puppeteer.default.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800',
    ],
  })
}

export async function createSession(): Promise<string> {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  const id = crypto.randomUUID()
  sessions.set(id, { id, page, browser, lastActivity: Date.now() })
  return id
}

function getSession(sessionId: string): BrowserSession {
  const session = sessions.get(sessionId)
  if (!session) throw new Error('Browser session not found')
  session.lastActivity = Date.now()
  return session
}

export async function navigate(sessionId: string, url: string): Promise<{ screenshot: string; title: string; url: string }> {
  const { page } = getSession(sessionId)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 1000))
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot, title: await page.title(), url: page.url() }
}

export async function click(sessionId: string, x: number, y: number): Promise<{ screenshot: string; title: string; url: string }> {
  const { page } = getSession(sessionId)
  await page.mouse.click(x, y)
  await new Promise(r => setTimeout(r, 800))
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot, title: await page.title(), url: page.url() }
}

export async function type(sessionId: string, text: string): Promise<{ screenshot: string }> {
  const { page } = getSession(sessionId)
  await page.keyboard.type(text)
  await new Promise(r => setTimeout(r, 300))
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot }
}

export async function keyPress(sessionId: string, key: string): Promise<{ screenshot: string }> {
  const { page } = getSession(sessionId)
  await page.keyboard.press(key as any)
  await new Promise(r => setTimeout(r, 500))
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot }
}

export async function screenshot(sessionId: string): Promise<{ screenshot: string; title: string; url: string }> {
  const { page } = getSession(sessionId)
  const img = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot: img, title: await page.title(), url: page.url() }
}

export async function goBack(sessionId: string): Promise<{ screenshot: string; title: string; url: string }> {
  const { page } = getSession(sessionId)
  await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {})
  await new Promise(r => setTimeout(r, 800))
  const img = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot: img, title: await page.title(), url: page.url() }
}

export async function goForward(sessionId: string): Promise<{ screenshot: string; title: string; url: string }> {
  const { page } = getSession(sessionId)
  await page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => {})
  await new Promise(r => setTimeout(r, 800))
  const img = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot: img, title: await page.title(), url: page.url() }
}

export async function refresh(sessionId: string): Promise<{ screenshot: string; title: string; url: string }> {
  const { page } = getSession(sessionId)
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {})
  await new Promise(r => setTimeout(r, 800))
  const img = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 }) as string
  return { screenshot: img, title: await page.title(), url: page.url() }
}

export async function closeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId)
  if (session) {
    await session.browser.close().catch(() => {})
    sessions.delete(sessionId)
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      session.browser.close().catch(() => {})
      sessions.delete(id)
    }
  }
}, 60_000)

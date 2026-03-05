import { useMutation } from '@tanstack/react-query'
import { browserApi } from '../lib/api'

export function useCreateBrowserSession() {
  return useMutation({ mutationFn: browserApi.createSession })
}

export function useBrowserNavigate() {
  return useMutation({
    mutationFn: ({ sessionId, url }: { sessionId: string; url: string }) =>
      browserApi.navigate(sessionId, url),
  })
}

export function useBrowserClick() {
  return useMutation({
    mutationFn: ({ sessionId, x, y }: { sessionId: string; x: number; y: number }) =>
      browserApi.click(sessionId, x, y),
  })
}

export function useBrowserType() {
  return useMutation({
    mutationFn: ({ sessionId, text }: { sessionId: string; text: string }) =>
      browserApi.type(sessionId, text),
  })
}

export function useBrowserKeyPress() {
  return useMutation({
    mutationFn: ({ sessionId, key }: { sessionId: string; key: string }) =>
      browserApi.keyPress(sessionId, key),
  })
}

export function useBrowserScreenshot() {
  return useMutation({
    mutationFn: (sessionId: string) => browserApi.screenshot(sessionId),
  })
}

export function useBrowserBack() {
  return useMutation({
    mutationFn: (sessionId: string) => browserApi.back(sessionId),
  })
}

export function useBrowserForward() {
  return useMutation({
    mutationFn: (sessionId: string) => browserApi.forward(sessionId),
  })
}

export function useBrowserRefresh() {
  return useMutation({
    mutationFn: (sessionId: string) => browserApi.refresh(sessionId),
  })
}

export function useCloseBrowserSession() {
  return useMutation({
    mutationFn: (sessionId: string) => browserApi.closeSession(sessionId),
  })
}

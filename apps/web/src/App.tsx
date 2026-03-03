import { useState } from 'react'
import { Desktop } from './components/Desktop'
import { Dock } from './components/Dock'
import { WindowManager } from './components/WindowManager'
import { useWindowStore } from './stores/windowStore'

function App() {
  return (
    <div className="h-full w-full relative">
      <Desktop />
      <WindowManager />
      <Dock />
    </div>
  )
}

export default App

import { useState } from 'react'
import { Desktop } from './components/Desktop'
import { Dock } from './components/Dock'
import { WindowManager } from './components/WindowManager'
import { GlobalSearch } from './components/GlobalSearch'
import { SetupWizard } from './components/SetupWizard'
import { useToastStore } from './stores/toastStore'

function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <>
      {toasts.map((t, i) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          style={{ bottom: `${80 + i * 44}px` }}
        >
          {t.message}
        </div>
      ))}
    </>
  )
}

function App() {
  const [showSetup, setShowSetup] = useState(
    () => !localStorage.getItem('nexusos_onboarding_done')
  )

  return (
    <div className="h-full w-full relative">
      {showSetup ? (
        <SetupWizard onComplete={() => setShowSetup(false)} />
      ) : (
        <>
          <Desktop />
          <WindowManager />
          <Dock />
          <GlobalSearch />
          <ToastContainer />
        </>
      )}
    </div>
  )
}

export default App

import { useState, useEffect } from 'react'
import { Desktop } from './components/Desktop'
import { Dock } from './components/Dock'
import { WindowManager } from './components/WindowManager'
import { GlobalSearch } from './components/GlobalSearch'
import { SetupWizard } from './components/SetupWizard'
import { useToastStore } from './stores/toastStore'
import { useWindowStore } from './stores/windowStore'

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

function WelcomeMessageTrigger() {
  const openWindow = useWindowStore(s => s.openWindow)

  useEffect(() => {
    if (localStorage.getItem('nexus_welcomed')) return
    localStorage.setItem('nexus_welcomed', '1')

    const timer = setTimeout(() => {
      openWindow({ id: 'chat', title: 'Chat', icon: 'MessageSquare', component: 'Chat' })
    }, 500)

    return () => clearTimeout(timer)
  }, [openWindow])

  return null
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
          <WelcomeMessageTrigger />
        </>
      )}
    </div>
  )
}

export default App

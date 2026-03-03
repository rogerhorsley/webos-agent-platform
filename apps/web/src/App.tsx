import { Desktop } from './components/Desktop'
import { Dock } from './components/Dock'
import { WindowManager } from './components/WindowManager'
import { GlobalSearch } from './components/GlobalSearch'

function App() {
  return (
    <div className="h-full w-full relative">
      <Desktop />
      <WindowManager />
      <Dock />
      <GlobalSearch />
    </div>
  )
}

export default App

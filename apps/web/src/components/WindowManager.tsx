import { useWindowStore } from '../stores/windowStore'
import { Window } from './Window'

export function WindowManager() {
  const { windows } = useWindowStore()

  return (
    <>
      {windows
        .filter(w => !w.isMinimized)
        .map(window => (
          <Window key={window.id} window={window} />
        ))}
    </>
  )
}

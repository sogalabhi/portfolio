import { useCallback, useEffect, useState } from 'react'
import { bus, EVENTS } from '../bus'
import WorldNav from './WorldNav'
import InteractPrompt from './InteractPrompt'
import ZonePanel from './ZonePanel'
import Terminal from './Terminal'
import FirstVisitHint from './FirstVisitHint'

export default function WorldOverlay() {
  const [nearZone, setNearZone] = useState(null)
  const [promptPos, setPromptPos] = useState(null)
  const [openZone, setOpenZone] = useState(null)

  const closePanel = useCallback(() => {
    setOpenZone(null)
    bus.emit(EVENTS.PAUSE_INPUT, false)
  }, [])

  useEffect(() => {
    const handleEnter = ({ id }) => setNearZone(id)
    const handleExit = () => {
      setNearZone(null)
      setPromptPos(null)
    }
    const handlePrompt = (pos) => setPromptPos(pos)
    const handleInteract = ({ id }) => {
      setOpenZone(id)
      bus.emit(EVENTS.PAUSE_INPUT, true)
    }

    bus.on(EVENTS.ZONE_ENTER, handleEnter)
    bus.on(EVENTS.ZONE_EXIT, handleExit)
    bus.on(EVENTS.PROMPT_POS, handlePrompt)
    bus.on(EVENTS.INTERACT, handleInteract)

    return () => {
      bus.off(EVENTS.ZONE_ENTER, handleEnter)
      bus.off(EVENTS.ZONE_EXIT, handleExit)
      bus.off(EVENTS.PROMPT_POS, handlePrompt)
      bus.off(EVENTS.INTERACT, handleInteract)
    }
  }, [])

  useEffect(() => {
    if (!openZone) return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [openZone, closePanel])

  return (
    <>
      <WorldNav />
      {!openZone && <FirstVisitHint />}
      {!openZone && nearZone && promptPos && (
        <InteractPrompt x={promptPos.x} y={promptPos.y} zoneId={nearZone} />
      )}
      {openZone === 'terminal' && <Terminal onClose={closePanel} />}
      {openZone && openZone !== 'terminal' && <ZonePanel zoneId={openZone} onClose={closePanel} />}
    </>
  )
}

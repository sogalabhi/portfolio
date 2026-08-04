import { useCallback, useEffect, useState } from 'react'
import { bus, EVENTS } from '../bus'
import { useMode } from '../DeviceModeContext'
import WorldNav from './WorldNav'
import InteractPrompt from './InteractPrompt'
import ZonePanel, { CONTENT_BY_ZONE, ZONE_TITLES } from './ZonePanel'
import BottomSheet from './BottomSheet'
import Terminal from './Terminal'
import FirstVisitHint from './FirstVisitHint'
import ZoneMenu from './ZoneMenu'
import RotatePrompt from './RotatePrompt'
import ZoneLabels from './ZoneLabels'

export default function WorldOverlay() {
  const mode = useMode()
  const [nearZone, setNearZone] = useState(null)
  const [promptPos, setPromptPos] = useState(null)
  const [openZone, setOpenZone] = useState(null)
  const [zoneLabels, setZoneLabels] = useState([])

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
    const handleZoneLabels = (labels) => setZoneLabels(labels)

    bus.on(EVENTS.ZONE_ENTER, handleEnter)
    bus.on(EVENTS.ZONE_EXIT, handleExit)
    bus.on(EVENTS.PROMPT_POS, handlePrompt)
    bus.on(EVENTS.INTERACT, handleInteract)
    bus.on(EVENTS.ZONE_LABELS, handleZoneLabels)

    return () => {
      bus.off(EVENTS.ZONE_ENTER, handleEnter)
      bus.off(EVENTS.ZONE_EXIT, handleExit)
      bus.off(EVENTS.PROMPT_POS, handlePrompt)
      bus.off(EVENTS.INTERACT, handleInteract)
      bus.off(EVENTS.ZONE_LABELS, handleZoneLabels)
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

  const handleSheetHeight = useCallback((heightPct) => {
    bus.emit(EVENTS.SHEET_FULL, heightPct >= 90)
  }, [])

  const zoneSheetOpen = openZone && openZone !== 'terminal'
  const ZoneContent = zoneSheetOpen ? CONTENT_BY_ZONE[openZone] : null

  return (
    <>
      <WorldNav />
      {!openZone && <ZoneLabels labels={zoneLabels} />}
      {mode === 'touch' && <ZoneMenu />}
      {!openZone && <FirstVisitHint />}
      {mode === 'pointer' && !openZone && nearZone && promptPos && (
        <InteractPrompt x={promptPos.x} y={promptPos.y} zoneId={nearZone} />
      )}
      {openZone === 'terminal' && <Terminal onClose={closePanel} />}
      {zoneSheetOpen && mode === 'touch' && (
        <BottomSheet
          title={ZONE_TITLES[openZone] ?? openZone}
          onClose={closePanel}
          onHeightChange={handleSheetHeight}
        >
          {ZoneContent ? <ZoneContent /> : <p className="text-[#F4EDE2]/70">Coming soon.</p>}
        </BottomSheet>
      )}
      {zoneSheetOpen && mode === 'pointer' && <ZonePanel zoneId={openZone} onClose={closePanel} />}
      <RotatePrompt />
    </>
  )
}

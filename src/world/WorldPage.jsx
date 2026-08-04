import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Phaser from 'phaser'
import { makeConfig, getViewportSize } from './config'
import { bus, EVENTS } from './bus'
import { useDeviceMode } from './useDeviceMode'
import { DeviceModeProvider } from './DeviceModeContext'
import WorldOverlay from './ui/WorldOverlay'
import EdgeCaseNotice from './ui/EdgeCaseNotice'
import profile from '../content/profile.json'

function WorldLoading({ progress }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-paper px-6">
      <p className="font-display text-lg font-semibold text-ink">{profile.name}</p>
      <div className="h-1.5 w-64 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-clay transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <Link to="/" className="text-sm text-slate underline underline-offset-2">
        ← Back to portfolio
      </Link>
    </div>
  )
}

export default function WorldPage() {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const mode = useDeviceMode()

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, follow'
    document.head.appendChild(meta)

    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = 'https://sogalabhi.vercel.app/'
    document.head.appendChild(canonical)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(meta)
      document.head.removeChild(canonical)
      document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) window.__worldBus = bus

    const handleProgress = (v) => setProgress(v)
    const handleReady = () => setReady(true)
    bus.on(EVENTS.BOOT_PROGRESS, handleProgress)
    bus.on(EVENTS.READY, handleReady)

    // mode is read once here, at the moment the game boots — Phaser scenes
    // pick camera/input config off the registry at create() and don't react
    // to it changing later (e.g. a tablet rotating mid-session)
    gameRef.current = new Phaser.Game(makeConfig(containerRef.current))
    gameRef.current.registry.set('mode', mode)

    // loop.sleep() covers two independent reasons the canvas isn't visible —
    // tab hidden, or a bottom sheet fully covering it — either can toggle
    // independently, so track both and only wake once neither holds
    let hidden = document.hidden
    let sheetFull = false
    const syncLoop = () => {
      if (!gameRef.current) return
      if (hidden || sheetFull) gameRef.current.loop.sleep()
      else gameRef.current.loop.wake()
    }

    const handleVisibility = () => {
      hidden = document.hidden
      syncLoop()
    }
    const handleSheetFull = (isFull) => {
      sheetFull = isFull
      syncLoop()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    bus.on(EVENTS.SHEET_FULL, handleSheetFull)

    // iOS Safari fires 'resize' continuously while the toolbar collapses on
    // scroll — debounce it, and read visualViewport (not innerWidth/Height,
    // which can lag during that same animation) for the size to resize to
    let resizeTimer = null
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (!gameRef.current) return
        const { width, height } = getViewportSize()
        gameRef.current.scale.resize(width, height)
      }, 150)
    }
    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)

    return () => {
      bus.off(EVENTS.BOOT_PROGRESS, handleProgress)
      bus.off(EVENTS.READY, handleReady)
      bus.off(EVENTS.SHEET_FULL, handleSheetFull)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <DeviceModeProvider value={mode}>
      <div className="fixed inset-0 overflow-hidden bg-[#87C5C2]">
        <div ref={containerRef} className="absolute inset-0" />
        {!ready && <WorldLoading progress={progress} />}
        {ready && <WorldOverlay />}
        <EdgeCaseNotice />
      </div>
    </DeviceModeProvider>
  )
}

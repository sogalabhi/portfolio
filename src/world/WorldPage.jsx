import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Phaser from 'phaser'
import { makeConfig } from './config'
import { bus, EVENTS } from './bus'
import WorldOverlay from './ui/WorldOverlay'
import profile from '../content/profile.json'

function isMobileGated() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024
}

function MobileGate() {
  const [countdown, setCountdown] = useState(4)
  const navigate = useNavigate()

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/')
      return undefined
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, navigate])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-paper px-6 text-center">
      <p className="max-w-[36ch] text-lg text-ink">
        The world is best on desktop. Here's the full portfolio instead.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-[10px] bg-clay px-5 py-3 text-sm font-medium text-paper transition-colors duration-150 hover:bg-clay/90"
      >
        {countdown > 0 ? `Go to portfolio (${countdown})` : 'Go to portfolio'}
      </Link>
      {countdown > 0 && (
        <button
          type="button"
          onClick={() => setCountdown(-1)}
          className="cursor-pointer text-sm text-slate underline underline-offset-2"
        >
          Cancel redirect
        </button>
      )}
    </div>
  )
}

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
  const [gated] = useState(isMobileGated)

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, follow'
    document.head.appendChild(meta)

    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = 'https://NEEDS_INPUT-your-domain.com/'
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
    if (gated) return undefined
    if (import.meta.env.DEV) window.__worldBus = bus

    const handleProgress = (v) => setProgress(v)
    const handleReady = () => setReady(true)
    bus.on(EVENTS.BOOT_PROGRESS, handleProgress)
    bus.on(EVENTS.READY, handleReady)

    gameRef.current = new Phaser.Game(makeConfig(containerRef.current))

    const handleVisibility = () => {
      if (!gameRef.current) return
      if (document.hidden) gameRef.current.loop.sleep()
      else gameRef.current.loop.wake()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      bus.off(EVENTS.BOOT_PROGRESS, handleProgress)
      bus.off(EVENTS.READY, handleReady)
      document.removeEventListener('visibilitychange', handleVisibility)
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [gated])

  if (gated) return <MobileGate />

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#87C5C2]">
      <div ref={containerRef} className="absolute inset-0" />
      {!ready && <WorldLoading progress={progress} />}
      {ready && <WorldOverlay />}
    </div>
  )
}

import { useEffect, useState } from 'react'

// Coarse pointer AND narrow viewport → 'touch'. A touchscreen laptop is
// 'pointer' (has a mouse too); an iPad in landscape at 1024px is 'pointer'
// and gets the desktop experience — click-to-move already covers it.
function computeMode() {
  if (typeof window === 'undefined') return 'pointer'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 900px)').matches
  return coarse && narrow ? 'touch' : 'pointer'
}

export function useDeviceMode() {
  const [mode, setMode] = useState(computeMode)

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: coarse)')
    const widthQuery = window.matchMedia('(max-width: 900px)')
    const update = () => setMode(computeMode())
    pointerQuery.addEventListener('change', update)
    widthQuery.addEventListener('change', update)
    return () => {
      pointerQuery.removeEventListener('change', update)
      widthQuery.removeEventListener('change', update)
    }
  }, [])

  return mode
}

// Sustained sub-30fps for 5+ seconds — not a single dropped frame, which
// happens on every device during asset load.
export function useLowFrameRate(thresholdMs = 5000) {
  const [low, setLow] = useState(false)

  useEffect(() => {
    let frames = 0
    let bucketStart = performance.now()
    let lowStreakMs = 0
    let raf

    const tick = (now) => {
      frames += 1
      const elapsed = now - bucketStart
      if (elapsed >= 1000) {
        const fps = (frames * 1000) / elapsed
        lowStreakMs = fps < 30 ? lowStreakMs + elapsed : 0
        if (lowStreakMs >= thresholdMs) setLow(true)
        frames = 0
        bucketStart = now
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [thresholdMs])

  return low
}

export function useNarrowViewport(maxWidth = 340) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < maxWidth
  )

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${maxWidth - 1}px)`)
    const update = () => setNarrow(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [maxWidth])

  return narrow
}

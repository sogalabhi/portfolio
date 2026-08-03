import { useSyncExternalStore } from 'react'

const query = () => window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribe(callback) {
  const media = query()
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => query().matches, () => false)
}

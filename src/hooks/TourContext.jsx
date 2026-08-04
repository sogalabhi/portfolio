import { createContext, useContext } from 'react'
import useTour from './useTour'

const TourContext = createContext(null)

// Hero (the launch affordance) and TourController (the active dialog) both
// need the same tour state - lifted here so 'start' called from one shows
// up as 'active' in the other, instead of each holding its own useTour().
export function TourProvider({ children }) {
  const tour = useTour()
  return <TourContext.Provider value={tour}>{children}</TourContext.Provider>
}

export function useTourContext() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTourContext must be used within a TourProvider')
  return ctx
}

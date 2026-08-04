import { createContext, useContext } from 'react'

const DeviceModeContext = createContext('pointer')

export const DeviceModeProvider = DeviceModeContext.Provider

export function useMode() {
  return useContext(DeviceModeContext)
}

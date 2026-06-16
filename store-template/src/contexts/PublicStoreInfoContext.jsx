import { createContext, useContext } from 'react'

const PublicStoreInfoContext = createContext(null)

export const PublicStoreInfoProvider = ({ value, children }) => (
  <PublicStoreInfoContext.Provider value={value}>
    {children}
  </PublicStoreInfoContext.Provider>
)

export const useSharedPublicStoreInfo = () => useContext(PublicStoreInfoContext)

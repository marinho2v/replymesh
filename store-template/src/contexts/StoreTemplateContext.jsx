import { createContext, useContext } from 'react'
import { getTemplate, DEFAULT_TEMPLATE_ID } from '../templates'

const StoreTemplateContext = createContext({
  templateId: DEFAULT_TEMPLATE_ID,
  template: getTemplate(DEFAULT_TEMPLATE_ID),
})

export const useStoreTemplate = () => useContext(StoreTemplateContext)

export const StoreTemplateProvider = ({ templateId, children }) => {
  const resolvedId = templateId || DEFAULT_TEMPLATE_ID
  const template = getTemplate(resolvedId)

  return (
    <StoreTemplateContext.Provider value={{ templateId: resolvedId, template }}>
      {children}
    </StoreTemplateContext.Provider>
  )
}

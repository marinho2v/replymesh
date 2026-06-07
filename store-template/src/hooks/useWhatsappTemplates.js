import { useState, useEffect } from 'react'
import {
  railsGetWhatsappTemplates,
  railsUpdateWhatsappTemplate,
} from '../services/storeApi'
import { toast } from 'sonner'

const normalizeRailsTemplate = (template = {}) => ({
  ...template,
  key: template.template_key || template.key,
  type: template.template_key || template.type,
  name: template.title || template.name,
  content: template.message || template.content,
  active: template.enabled !== false,
})

export const useWhatsappTemplates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const data = (await railsGetWhatsappTemplates()).map(normalizeRailsTemplate)
        setTemplates(data || [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const refetch = () => {
    setLoading(true)
    railsGetWhatsappTemplates()
      .then(data => data.map(normalizeRailsTemplate))
      .then(setTemplates)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  const saveTemplate = async (templateId, templateData) => {
    try {
      let data = await railsUpdateWhatsappTemplate(templateId, {
        title: templateData.title || templateData.name,
        message: templateData.message || templateData.content,
        enabled: templateData.active !== false,
      })
      data = normalizeRailsTemplate(data)
      setTemplates(prev => prev.map(t => t.id === templateId ? data : t))
      toast.success('Template atualizado com sucesso')
      return { success: true, template: data }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Erro ao atualizar template')
      return { success: false }
    }
  }

  const createTemplate = async (templateData) => {
    console.warn('Templates novos sao provisionados pelo onboarding Rails.', templateData)
    toast.error('Templates novos sao criados automaticamente no onboarding.')
    return { success: false }
  }

  return { templates, loading, error, refetch, saveTemplate, createTemplate }
}

export const useWhatsappTemplate = (key) => {
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true)
        const data = (await railsGetWhatsappTemplates()).map(normalizeRailsTemplate)
        setTemplate(data.find((item) => item.key === key || item.type === key) || null)
      } catch (error) {
        console.error('Error fetching template:', error)
      } finally {
        setLoading(false)
      }
    }

    if (key) {
      fetchTemplate()
    }
  }, [key])

  return { template, loading }
}

import hamburgueriaClassicMeta from './hamburgueria-classic/metadata.json'
import hamburgueriaPremiumMeta from './hamburgueria-premium/metadata.json'
import pizzariaDarkMeta from './pizzaria-dark/metadata.json'
import doceiraCleanMeta from './doceria-clean/metadata.json'
import bebidasNeonMeta from './bebidas-neon/metadata.json'

export const DEFAULT_TEMPLATE_ID = 'hamburgueria-classic'

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'hamburgueria', label: 'Hamburgueria' },
  { id: 'pizzaria', label: 'Pizzaria' },
  { id: 'doceria', label: 'Doceria' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'acai', label: 'Açaí' },
  { id: 'restaurante', label: 'Restaurante' },
]

export const VISUAL_TEMPLATES = [
  {
    ...hamburgueriaClassicMeta,
    previewGradient: 'from-[#0A0A0A] via-[#1A1A1A] to-[#252525]',
    previewAccentColor: '#FFFFFF',
    previewTextColor: '#FFFFFF',
  },
  {
    ...hamburgueriaPremiumMeta,
    previewGradient: 'from-[#0c0c0e] via-[#1a1a1d] to-[#26262a]',
    previewAccentColor: '#f7a325',
    previewTextColor: '#f4f3f1',
  },
  {
    ...pizzariaDarkMeta,
    previewGradient: 'from-[#100810] via-[#200c20] to-[#3d1a1a]',
    previewAccentColor: '#DC2626',
    previewTextColor: '#F9FAFB',
  },
  {
    ...doceiraCleanMeta,
    previewGradient: 'from-[#FFF8F0] via-[#FFFFFF] to-[#FDF2E9]',
    previewAccentColor: '#EC4899',
    previewTextColor: '#1F2937',
  },
  {
    ...bebidasNeonMeta,
    previewGradient: 'from-[#020712] via-[#060E1E] to-[#0A1628]',
    previewAccentColor: '#22D3EE',
    previewTextColor: '#F0F9FF',
  },
]

export const getAllTemplates = () => VISUAL_TEMPLATES

export const getTemplateById = (id) =>
  VISUAL_TEMPLATES.find((t) => t.id === id) || VISUAL_TEMPLATES[0]

export const getTemplatesByCategory = (category) => {
  if (!category || category === 'all') return VISUAL_TEMPLATES
  return VISUAL_TEMPLATES.filter((t) => t.category === category)
}

export const getTemplateCategories = () => TEMPLATE_CATEGORIES

export const isValidTemplateId = (id) =>
  VISUAL_TEMPLATES.some((t) => t.id === id)

export const getTemplate = getTemplateById

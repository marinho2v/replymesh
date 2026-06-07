import { runSupabaseQuery, supabase } from './supabase'

const clearCategoryCache = () => {
  try {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('categories:') || key.startsWith('products:'))
      .forEach(key => sessionStorage.removeItem(key))
  } catch {
    // Cache is only a speed aid; ignore storage errors.
  }
}

const isMissingColumnError = (error) => (
  ['42703', 'PGRST204'].includes(error?.code)
)

const CATEGORY_NAME_OVERRIDES = {
  combos: 'Combos hambúrguer tradicional',
  'hamburguer-artesanal': 'Artesanal',
}

const applyCategoryOverrides = (category) => ({
  ...category,
  name: CATEGORY_NAME_OVERRIDES[category.slug] || category.name,
})

export const getCategories = async (activeOnly = true, includeDeleted = false) => {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }

    let { data, error } = await runSupabaseQuery(query)

    if (error && isMissingColumnError(error)) {
      query = supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      ;({ data, error } = await runSupabaseQuery(query))
    }

    if (error) throw error
    return (data || []).map(applyCategoryOverrides)
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

export const getCategoryById = async (categoryId) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (error) throw error
    return data ? applyCategoryOverrides(data) : data
  } catch (error) {
    console.error('Error fetching category:', error)
    throw error
  }
}

export const createCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) throw error
    clearCategoryCache()
    return data
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error
    clearCategoryCache()
    return data
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
}

export const toggleCategoryActive = async (categoryId, isActive) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ is_active: isActive })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error
    clearCategoryCache()
    return data
  } catch (error) {
    console.error('Error toggling category:', error)
    throw error
  }
}

export const deleteCategory = async (categoryId) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (!error) {
      clearCategoryCache()
      return true
    }

    const { error: softDeleteError } = await supabase
      .from('categories')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', categoryId)

    if (!softDeleteError) {
      clearCategoryCache()
      return true
    }

    if (isMissingColumnError(softDeleteError)) {
      const { error: legacyError } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', categoryId)

      if (legacyError) throw legacyError
      clearCategoryCache()
      return true
    }

    throw softDeleteError
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

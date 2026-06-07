import { runSupabaseQuery, supabase } from './supabase'

const sortByOrder = (items = []) => (
  [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
)

export const getProductOptionGroups = async (productId, { activeOnly = true } = {}) => {
  if (!productId) return []

  const { data, error } = await runSupabaseQuery(supabase
    .from('product_option_groups')
    .select(`
      *,
      items:product_option_items (*)
    `)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true }))

  if (error) throw error

  return (data || []).map(group => ({
    ...group,
    items: sortByOrder(group.items || [])
      .filter(item => !activeOnly || item.is_active !== false),
  }))
}

export const saveProductOptionGroups = async (productId, groups = []) => {
  if (!productId) return []

  const normalizedGroups = groups
    .map((group, groupIndex) => ({
      ...group,
      name: String(group.name || '').trim(),
      type: group.type === 'multiple' ? 'multiple' : 'single',
      required: Boolean(group.required),
      min_select: Number(group.min_select || 0),
      max_select: Number(group.max_select || (group.type === 'multiple' ? 1 : 1)),
      sort_order: Number(group.sort_order ?? groupIndex),
      items: (group.items || [])
        .map((item, itemIndex) => ({
          ...item,
          name: String(item.name || '').trim(),
          additional_price: Number(item.additional_price || 0),
          is_active: item.is_active !== false,
          sort_order: Number(item.sort_order ?? itemIndex),
        }))
        .filter(item => item.name),
    }))
    .filter(group => group.name)

  const existingGroups = await getProductOptionGroups(productId, { activeOnly: false })
  const existingGroupIds = existingGroups.map(group => group.id).filter(Boolean)

  for (const group of normalizedGroups) {
    const groupPayload = {
      product_id: productId,
      name: group.name,
      type: group.type,
      required: group.required,
      min_select: group.min_select,
      max_select: group.max_select,
      sort_order: group.sort_order,
    }

    const { data: savedGroup, error: groupError } = group.id
      ? await supabase
          .from('product_option_groups')
          .update(groupPayload)
          .eq('id', group.id)
          .select()
          .single()
      : await supabase
          .from('product_option_groups')
          .insert(groupPayload)
          .select()
          .single()

    if (groupError) throw groupError

    const existingItems = existingGroups
      .find(item => item.id === savedGroup.id)?.items || []
    const keptItemIds = []

    for (const item of group.items) {
      const itemPayload = {
        group_id: savedGroup.id,
        name: item.name,
        additional_price: item.additional_price,
        is_active: item.is_active,
        sort_order: item.sort_order,
      }

      const { data: savedItem, error: itemError } = item.id
        ? await supabase
            .from('product_option_items')
            .update(itemPayload)
            .eq('id', item.id)
            .select()
            .single()
        : await supabase
            .from('product_option_items')
            .insert(itemPayload)
            .select()
            .single()

      if (itemError) throw itemError
      keptItemIds.push(savedItem.id)
    }

    const removedItemIds = existingItems
      .map(item => item.id)
      .filter(id => id && !keptItemIds.includes(id))

    if (removedItemIds.length > 0) {
      const { error: deleteItemsError } = await supabase
        .from('product_option_items')
        .delete()
        .in('id', removedItemIds)

      if (deleteItemsError) throw deleteItemsError
    }
  }

  const keptGroupIds = normalizedGroups.map(group => group.id).filter(Boolean)
  const removedGroupIds = existingGroupIds.filter(id => !keptGroupIds.includes(id))

  if (removedGroupIds.length > 0) {
    const { error } = await supabase
      .from('product_option_groups')
      .delete()
      .in('id', removedGroupIds)

    if (error) throw error
  }

  return getProductOptionGroups(productId, { activeOnly: false })
}


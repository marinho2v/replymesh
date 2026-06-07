export const normalizeSelectedOptions = (selectedOptions = []) => (
  Array.isArray(selectedOptions)
    ? selectedOptions
        .map(group => ({
          group_name: group.group_name || group.name || '',
          options: Array.isArray(group.options)
            ? group.options.map(option => (
                typeof option === 'string'
                  ? option
                  : option?.name
              )).filter(Boolean)
            : [],
        }))
        .filter(group => group.group_name && group.options.length > 0)
    : []
)

export const formatSelectedOptions = (selectedOptions = []) => (
  normalizeSelectedOptions(selectedOptions)
    .map(group => `${group.group_name}: ${group.options.join(', ')}`)
)

export const selectedOptionsKey = (selectedOptions = []) => (
  JSON.stringify(normalizeSelectedOptions(selectedOptions))
)

export const hasSelectedOptions = (selectedOptions = []) => (
  normalizeSelectedOptions(selectedOptions).length > 0
)


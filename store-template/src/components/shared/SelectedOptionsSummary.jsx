import { formatSelectedOptions } from '../../utils/productOptions'

const SelectedOptionsSummary = ({ selectedOptions, className = '' }) => {
  const lines = formatSelectedOptions(selectedOptions)

  if (lines.length === 0) return null

  return (
    <div className={`mt-1 space-y-0.5 text-sm text-gray-400 ${className}`}>
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line}</p>
      ))}
    </div>
  )
}

export default SelectedOptionsSummary


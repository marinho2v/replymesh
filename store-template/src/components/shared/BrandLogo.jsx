import { clsx } from 'clsx'
import { Store } from 'lucide-react'

const BrandLogo = ({
  showText = true,
  size = 'md',
  className = '',
  textClassName = '',
  name = '',
  logoUrl = '',
}) => {
  const sizes = {
    sm: 'h-9 w-14',
    md: 'h-11 w-16',
    lg: 'h-20 w-28',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <div className={clsx('flex items-center gap-3 min-w-0', className)}>
      <span className={clsx('shrink-0 flex items-center justify-center', sizes[size] || sizes.md)}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-900 text-gray-300">
            <Store size={size === 'lg' ? 32 : size === 'sm' ? 18 : 24} aria-hidden="true" />
          </span>
        )}
      </span>
      {showText && (
        <span className={clsx('truncate font-bold text-white', textSizes[size] || textSizes.md, textClassName)}>
          {name}
        </span>
      )}
    </div>
  )
}

export default BrandLogo

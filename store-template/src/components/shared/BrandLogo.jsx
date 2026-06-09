import { clsx } from 'clsx'

const BrandLogo = ({
  showText = true,
  size = 'md',
  className = '',
  textClassName = '',
  name = '',
  logoUrl = '/logo.png',
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
        <img
          src={logoUrl || '/logo.png'}
          alt={name}
          className="h-full w-full object-contain"
        />
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

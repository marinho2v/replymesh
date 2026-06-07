import { clsx } from 'clsx'

export const Badge = ({
  children,
  variant = 'default',
  className,
}) => {
  const variants = {
    default: 'bg-dark-700 text-gray-300',
    primary: 'bg-gray-700 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-600 text-white',
    info: 'bg-blue-500 text-white',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

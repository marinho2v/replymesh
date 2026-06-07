import { clsx } from 'clsx'

export const Card = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-dark-800 rounded-xl border border-dark-600 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className }) => {
  return (
    <div className={clsx('p-6 border-b border-dark-600', className)}>
      {children}
    </div>
  )
}

export const CardContent = ({ children, className }) => {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  )
}

export const CardFooter = ({ children, className }) => {
  return (
    <div className={clsx('p-6 border-t border-dark-600', className)}>
      {children}
    </div>
  )
}

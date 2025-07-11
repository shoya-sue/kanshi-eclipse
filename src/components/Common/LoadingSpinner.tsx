interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'gray'
  className?: string
}

const LoadingSpinner = ({ size = 'md', color = 'primary', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
  
  const colorClasses = {
    primary: 'border-eclipse-primary',
    secondary: 'border-eclipse-secondary',
    gray: 'border-gray-400',
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-transparent border-t-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
    </div>
  )
}

export default LoadingSpinner
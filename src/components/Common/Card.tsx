import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const Card = ({ children, className = '', padding = 'md' }: CardProps) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

export default Card
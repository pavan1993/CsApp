import React from 'react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={clsx('flex items-center justify-center', className)} data-testid="loading-spinner">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={clsx('animate-spin text-blue-600', sizeClasses[size])} />
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  )
}

// Full page loading component
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

// Inline loading component
export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  )
}

export default LoadingSpinner

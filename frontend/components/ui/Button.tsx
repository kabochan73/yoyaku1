'use client'

import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'danger' | 'ghost'
  isLoading?: boolean
}

export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: Props) {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    danger:  'bg-red-500 text-white hover:bg-red-600',
    ghost:   'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? '処理中...' : children}
    </button>
  )
}

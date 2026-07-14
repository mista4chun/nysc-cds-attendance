// components/ui/PasswordInput.tsx
'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff }          from 'lucide-react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ hasError, className, ...props }, ref) => {
    const [show, setShow] = useState(false)

    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm
            bg-background text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow
            ${hasError ? 'border-destructive bg-destructive/5' : 'border-input'}
            ${className ?? ''}`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
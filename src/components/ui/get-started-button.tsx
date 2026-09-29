'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GetStartedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  href?: string
}

export function GetStartedButton({ children = 'Get started', className, href, ...props }: GetStartedButtonProps) {
  const classes = cn(
    'group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md bg-[#eeeeee] px-5 pr-14 text-sm font-medium text-black transition-all duration-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50',
    className,
  )
  const content = <>
    <span className="relative z-0 whitespace-nowrap pr-2 transition-opacity duration-500 group-hover:opacity-0">{children}</span>
    <span className="absolute bottom-1 right-1 top-1 z-10 grid w-10 place-items-center rounded-sm bg-[#ee6018]/15 text-black transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
    </span>
  </>

  if (href) return <a href={href} className={classes}>{content}</a>
  return <button {...props} className={classes}>{content}</button>
}

export default GetStartedButton

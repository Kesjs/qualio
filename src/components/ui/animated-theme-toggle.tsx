'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedThemeToggleProps {
  className?: string
}

export function AnimatedThemeToggle({ className }: AnimatedThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-9 w-9 rounded-lg border border-gray-200/80 bg-white/80 dark:border-white/[0.08] dark:bg-[#16181E]',
          className
        )}
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-600 shadow-2xs transition-all hover:text-gray-900 hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-300 dark:hover:text-white dark:hover:border-white/20 cursor-pointer',
        className
      )}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label="Basculer le thème clair / sombre"
    >
      <SolarSwitch isDark={isDark} />
    </button>
  )
}

function SolarSwitch({ isDark }: { isDark: boolean }) {
  const duration = 0.45

  const moonVariants = {
    checked: {
      scale: 1,
      opacity: 1,
      rotate: 0,
    },
    unchecked: {
      scale: 0,
      opacity: 0,
      rotate: -90,
    },
  }

  const sunVariants = {
    checked: {
      scale: 0,
      opacity: 0,
      rotate: 90,
    },
    unchecked: {
      scale: 1,
      opacity: 1,
      rotate: 0,
    },
  }

  const scaleMoon = useMotionValue(isDark ? 1 : 0)
  const scaleSun = useMotionValue(isDark ? 0 : 1)
  const pathLengthMoon = useTransform(scaleMoon, [0.5, 1], [0, 1])
  const pathLengthSun = useTransform(scaleSun, [0.5, 1], [0, 1])

  return (
    <motion.div
      animate={isDark ? 'checked' : 'unchecked'}
      className="relative flex items-center justify-center h-4.5 w-4.5"
    >
      <motion.svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        {/* Sun Core */}
        <motion.circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{
            pathLength: pathLengthSun,
            scale: scaleSun,
          }}
        />

        {/* Sun Rays */}
        <motion.path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunVariants}
          custom={isDark}
          transition={{ duration }}
          style={{
            pathLength: pathLengthSun,
            scale: scaleSun,
          }}
        />

        {/* Moon Crescent */}
        <motion.path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={moonVariants}
          custom={isDark}
          transition={{ duration }}
          style={{
            pathLength: pathLengthMoon,
            scale: scaleMoon,
          }}
        />
      </motion.svg>
    </motion.div>
  )
}

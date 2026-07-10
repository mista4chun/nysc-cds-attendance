// // components/layout/ThemeToggle.tsx
// 'use client'

// import { useTheme }  from 'next-themes'
// import { useEffect, useState } from 'react'
// import { Sun, Moon, Monitor } from 'lucide-react'

// export function ThemeToggle() {
//   const { theme, setTheme } = useTheme()
//   const [mounted, setMounted] = useState(false)

//   // Avoid hydration mismatch
//   useEffect(() => setMounted(true), [])
//   if (!mounted) return null

//   return (
//     <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
//       {[
//         { value: 'light',  icon: Sun,     label: 'Light'  },
//         { value: 'system', icon: Monitor, label: 'System' },
//         { value: 'dark',   icon: Moon,    label: 'Dark'   },
//       ].map(({ value, icon: Icon, label }) => (
//         <button
//           key={value}
//           onClick={() => setTheme(value)}
//           title={label}
//           className={`p-1.5 rounded-md transition-colors
//             ${theme === value
//               ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
//               : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
//             }`}
//         >
//           <Icon size={14} />
//         </button>
//       ))}
//     </div>
//   )
// }
// components/layout/ThemeToggle.tsx
'use client'

import { useTheme }  from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {[
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark',  icon: Moon, label: 'Dark'  },
      ].map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`p-1.5 rounded-md transition-colors
            ${theme === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
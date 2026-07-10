// components/charts/RechartsComponents.tsx
// Lazy-loads all Recharts components — saves ~120kb from dashboard bundle
// import dynamic from 'next/dynamic'
 
// export const BarChartDynamic = dynamic(
//   () => import('recharts').then(m => ({ default: m.BarChart })),
//   { ssr: false }
// )
 
// export const PieChartDynamic = dynamic(
//   () => import('recharts').then(m => ({ default: m.PieChart })),
//   { ssr: false }
// )

// components/charts/RechartsComponents.tsx
'use client'

import dynamic from 'next/dynamic'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts'

// 1. Create standard internal wrapper components
const BarChartInternal = ({ data, children, ...props }: any) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} {...props}>
      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
      <XAxis dataKey="name" stroke="#888888" fontSize={12} />
      <YAxis stroke="#888888" fontSize={12} />
      <Tooltip />
      <Legend />
      {/* This allows you to pass custom <Bar /> components from the outside */}
      {children}
    </BarChart>
  </ResponsiveContainer>
)

const PieChartInternal = ({ data, children, ...props }: any) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart {...props}>
      <Tooltip />
      <Legend />
      {children}
    </PieChart>
  </ResponsiveContainer>
)

// 2. Export them dynamically with SSR disabled
export const BarChartDynamic = dynamic(() => Promise.resolve(BarChartInternal), { ssr: false })
export const PieChartDynamic = dynamic(() => Promise.resolve(PieChartInternal), { ssr: false })

// 3. Export the primitive sub-components as standard, raw exports.
// Because of 'optimizePackageImports', these are automatically optimized!
export { Bar, Pie, Cell,XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend } 
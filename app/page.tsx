// app/page.tsx
// The root "/" just redirects — middleware handles where they go
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
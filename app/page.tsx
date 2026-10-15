'use client'

import dynamic from 'next/dynamic'

// The store reads localStorage during initial state, so render it client-only to avoid hydration mismatches.
const CoffeeStore = dynamic(() => import('@/components/coffee-store'), { ssr: false })

export default function Page() {
  return <CoffeeStore />
}

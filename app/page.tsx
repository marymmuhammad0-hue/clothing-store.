'use client'

import dynamic from 'next/dynamic'

// استدعاء ملف متجر الملابس الجديد ديناميكياً
const ClothingStore = dynamic(() => import('@/components/marymmuhammad0-hue/clothing-store'), { ssr: false })

export default function Page() {
    return <ClothingStore />
}

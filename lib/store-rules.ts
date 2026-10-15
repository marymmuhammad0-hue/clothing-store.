export const CATEGORIES = ['محوج', 'سادة', 'نكهات'] as const
export const WEIGHTS = ['250g', '500g', '1000g'] as const
export const GRINDS = ['طحنة ناعمة (تركية)', 'حبوب كاملة (حصى)', 'طحنة متوسطة (فلتر)', 'طحنة إسبرسو'] as const
export const ORDER_STATUSES = ['جديد', 'جاري الشحن', 'تم التسليم', 'ملغي'] as const

export const MAX_QTY_PER_ORDER = 50
export const FREE_DELIVERY_THRESHOLD = 1000
export const DELIVERY_FEE = 40

export function calculatePrice(basePrice: number, weight: string) {
  if (weight === '250g') return Math.round(basePrice * 0.55)
  if (weight === '1000g') return Math.round(basePrice * 1.85)
  return basePrice
}

export function deliveryFeeFor(subtotal: number) {
  return subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

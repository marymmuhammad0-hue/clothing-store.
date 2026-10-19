import { CATEGORIES } from './store-rules'

const MAX_IMAGE_LENGTH = 3_000_000

export function cleanText(value: unknown, maxlength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxlength)
}

export function toInt(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isInteger(n) ? n : null
}

export function parseProductInput(body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, string | number> = {}
  const errors: string[] = []

  if (!partial || 'name' in body) {
    const name = cleanText(body.name, 120)
    if (!name) errors.push('اسم المنتج مطلوب')
    out.name = name
  }
  if (!partial || 'subtitle' in body) {
    out.subtitle = cleanText(body.subtitle, 200)
  }
  if (!partial || 'description' in body) {
    out.description = cleanText(body.description, 1000)
  }
  if (!partial || 'priceBase' in body || 'price_base' in body) {
    const rawPrice = body.priceBase ?? body.price_base
    const price = toInt(rawPrice)
    if (price === null || price <= 0 || price > 100_000) {
      errors.push('السعر غير صالح')
    } else {
      out.price_base = price
    }
  }
  if (!partial || 'stock' in body) {
    const stock = toInt(body.stock)
    if (stock === null || stock < 0 || stock > 100_000) {
      errors.push('الكمية غير صالحة')
    } else {
      out.stock = stock
    }
  }
  if (!partial || 'category' in body) {
    const category = cleanText(body.category, 48)
    if (!(CATEGORIES as readonly string[]).includes(category)) {
      errors.push('التصنيف غير صالح')
    } else {
      out.category = category
    }
  }
  if (!partial || 'image' in body) {
    const image = typeof body.image === 'string' ? body.image.trim() : ''
    const valid = image === '' || /^https:\/\//.test(image) || /^data:image\/(png|jpeg|webp|gif);base64,/.test(image)
    if (!valid || image.length > MAX_IMAGE_LENGTH) {
      errors.push('الصورة غير صالحة أو كبيرة جداً')
    } else {
      out.image = image
    }
  }

  return { data: out, errors }
}

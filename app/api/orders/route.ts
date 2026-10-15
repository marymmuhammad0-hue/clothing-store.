import { randomInt } from 'node:crypto'
import { query, toOrder, withTransaction, type OrderItem, type OrderRow, type ProductRow } from '@/lib/db'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { calculatePrice, deliveryFeeFor, GRINDS, MAX_QTY_PER_ORDER, WEIGHTS } from '@/lib/store-rules'
import { cleanText, toInt } from '@/lib/validate'

class OrderError extends Error {}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()
  const rows = await query<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC')
  return Response.json(rows.map(toOrder))
}

type RequestedLine = { productId: number; weight: string; grind: string; qty: number }

function parseLines(raw: unknown): RequestedLine[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) throw new OrderError('سلة التسوق غير صالحة')

  const merged = new Map<string, RequestedLine>()
  for (const entry of raw) {
    const productId = toInt(entry?.productId)
    const qty = toInt(entry?.qty)
    const weight = String(entry?.weight ?? '')
    const grind = String(entry?.grind ?? '')
    if (productId === null || qty === null || qty <= 0) throw new OrderError('كمية غير صالحة')
    if (!(WEIGHTS as readonly string[]).includes(weight)) throw new OrderError('وزن غير صالح')
    if (!(GRINDS as readonly string[]).includes(grind)) throw new OrderError('درجة طحن غير صالحة')

    const key = `${productId}|${weight}|${grind}`
    const existing = merged.get(key)
    merged.set(key, { productId, weight, grind, qty: (existing?.qty ?? 0) + qty })
  }

  const lines = [...merged.values()]
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0)
  if (totalQty > MAX_QTY_PER_ORDER) throw new OrderError(`الحد الأقصى ${MAX_QTY_PER_ORDER} قطعة لكل طلب`)
  return lines
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return Response.json({ error: 'طلب غير صالح' }, { status: 400 })

  const name = cleanText(body.customer?.name, 120)
  const phone = cleanText(body.customer?.phone, 30)
  const address = cleanText(body.customer?.address, 500)
  if (!name || !address || !/^\+?[0-9\s-]{8,20}$/.test(phone)) {
    return Response.json({ error: 'يرجى استكمال البيانات بشكل صحيح.' }, { status: 400 })
  }

  try {
    const lines = parseLines(body.items)

    const order = await withTransaction(async (client) => {
      const productIds = [...new Set(lines.map((line) => line.productId))]
      const { rows: products } = await client.query<ProductRow>(
        'SELECT * FROM products WHERE id = ANY($1::int[]) FOR UPDATE',
        [productIds],
      )
      const byId = new Map(products.map((product) => [product.id, product]))

      const qtyByProduct = new Map<number, number>()
      for (const line of lines) {
        qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) ?? 0) + line.qty)
      }

      for (const [productId, qty] of qtyByProduct) {
        const product = byId.get(productId)
        if (!product) throw new OrderError('أحد المنتجات لم يعد متاحاً')
        if (product.stock < qty) throw new OrderError(`الكمية المتاحة من "${product.name}" هي ${product.stock} فقط`)
      }

      const items: OrderItem[] = lines.map((line) => {
        const product = byId.get(line.productId)!
        return {
          id: product.id,
          name: product.name,
          image: product.image.startsWith('data:') ? '' : product.image,
          weight: line.weight,
          grind: line.grind,
          price: calculatePrice(product.price_base, line.weight),
          qty: line.qty,
        }
      })
      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
      const deliveryFee = deliveryFeeFor(subtotal)

      for (const [productId, qty] of qtyByProduct) {
        await client.query('UPDATE products SET stock = stock - $2 WHERE id = $1', [productId, qty])
      }

      const orderId = `ORD-${randomInt(100000, 1000000)}`
      const { rows } = await client.query<OrderRow>(
        `INSERT INTO orders (id, customer_name, customer_phone, customer_address, items, subtotal, delivery_fee, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [orderId, name, phone, address, JSON.stringify(items), subtotal, deliveryFee, subtotal + deliveryFee],
      )
      return rows[0]
    })

    return Response.json(toOrder(order), { status: 201 })
  } catch (error) {
    if (error instanceof OrderError) return Response.json({ error: error.message }, { status: 400 })
    console.error('Order creation failed', error)
    return Response.json({ error: 'تعذر إتمام الطلب، حاول مرة أخرى.' }, { status: 500 })
  }
}

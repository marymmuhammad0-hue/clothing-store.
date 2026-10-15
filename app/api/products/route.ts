import { query, toProduct, type ProductRow } from '@/lib/db'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { parseProductInput } from '@/lib/validate'

const DEFAULT_IMAGE = 'https://i.ibb.co/sJp8k2JP/coffee.jpg'

export async function GET() {
  const rows = await query<ProductRow>('SELECT * FROM products ORDER BY id')
  return Response.json(rows.map(toProduct))
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return Response.json({ error: 'طلب غير صالح' }, { status: 400 })

  const { data, errors } = parseProductInput(body, false)
  if (errors.length) return Response.json({ error: errors.join('، ') }, { status: 400 })

  const [row] = await query<ProductRow>(
    `INSERT INTO products (name, subtitle, price_base, category, image, description, stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      data.name,
      data.subtitle || 'توليفة خاصة فاخرة',
      data.price_base,
      data.category,
      data.image || DEFAULT_IMAGE,
      data.description || 'منتج جديد أضيف حديثاً.',
      data.stock,
    ],
  )
  return Response.json(toProduct(row), { status: 201 })
}

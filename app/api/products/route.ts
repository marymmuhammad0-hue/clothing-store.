import { query, toProduct, type ProductRow } from '@/lib/db'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'

export async function GET() {
  const rows = await query<ProductRow>('SELECT * FROM products ORDER BY id')
  return Response.json(rows.map(toProduct))
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized()

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'طلب غير صالح' }, { status: 400 })
  }

  const { name, subtitle, priceBase, category, image, stock } = body

  if (!name || !priceBase || !category) {
    return Response.json({ error: 'يرجى إكمال بيانات المنتج الأساسية' }, { status: 400 })
  }

  const [row] = await query<ProductRow>(
    `INSERT INTO products (name, subtitle, price_base, category, image, stock)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      name,
      subtitle || '',
      Number(priceBase),
      category,
      typeof image === 'string' ? image : JSON.stringify(image || []),
      Number(stock) || 10,
    ]
  )

  return Response.json(toProduct(row), { status: 201 })
}

import { query, toProduct, type ProductRow } from '@/lib/db'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { parseProductInput, toInt } from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

const UPDATABLE_COLUMNS = ['name', 'subtitle', 'price_base', 'category', 'image', 'description', 'stock']

export async function PATCH(request: Request, { params }: Context) {
  if (!isAdminRequest(request)) return unauthorized()
  const id = toInt((await params).id)
  if (id === null) return Response.json({ error: 'معرف غير صالح' }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return Response.json({ error: 'طلب غير صالح' }, { status: 400 })

  const { data, errors } = parseProductInput(body, true)
  if (errors.length) return Response.json({ error: errors.join('، ') }, { status: 400 })

  const columns = UPDATABLE_COLUMNS.filter((column) => column in data)
  if (columns.length === 0) return Response.json({ error: 'لا توجد تعديلات' }, { status: 400 })

  const assignments = columns.map((column, i) => `${column} = $${i + 2}`).join(', ')
  const [row] = await query<ProductRow>(`UPDATE products SET ${assignments} WHERE id = $1 RETURNING *`, [
    id,
    ...columns.map((column) => data[column]),
  ])
  if (!row) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
  return Response.json(toProduct(row))
}

export async function DELETE(request: Request, { params }: Context) {
  if (!isAdminRequest(request)) return unauthorized()
  const id = toInt((await params).id)
  if (id === null) return Response.json({ error: 'معرف غير صالح' }, { status: 400 })

  const rows = await query<{ id: number }>('DELETE FROM products WHERE id = $1 RETURNING id', [id])
  if (rows.length === 0) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
  return new Response(null, { status: 204 })
}

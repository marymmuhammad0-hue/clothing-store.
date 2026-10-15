import { query, toOrder, type OrderRow } from '@/lib/db'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { ORDER_STATUSES } from '@/lib/store-rules'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  if (!isAdminRequest(request)) return unauthorized()
  const { id } = await params

  const body = await request.json().catch(() => null)
  const status = body?.status
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    return Response.json({ error: 'حالة غير صالحة' }, { status: 400 })
  }

  const [row] = await query<OrderRow>('UPDATE orders SET status = $2 WHERE id = $1 RETURNING *', [id, status])
  if (!row) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
  return Response.json(toOrder(row))
}

export async function DELETE(request: Request, { params }: Context) {
  if (!isAdminRequest(request)) return unauthorized()
  const { id } = await params

  const rows = await query<{ id: string }>('DELETE FROM orders WHERE id = $1 RETURNING id', [id])
  if (rows.length === 0) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
  return new Response(null, { status: 204 })
}

import { isAdminPassword } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'لم يتم ضبط كلمة مرور المدير (ADMIN_PASSWORD) بعد.' }, { status: 503 })
  }
  const body = await request.json().catch(() => null)
  if (!isAdminPassword(typeof body?.password === 'string' ? body.password : '')) {
    return Response.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 })
  }
  return Response.json({ ok: true })
}

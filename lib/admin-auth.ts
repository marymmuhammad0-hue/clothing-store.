import { createHash, timingSafeEqual } from 'node:crypto'

function digest(value: string) {
  return createHash('sha256').update(value).digest()
}

export function isAdminPassword(candidate: string | null | undefined) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !candidate) return false
  return timingSafeEqual(digest(candidate), digest(expected))
}

export function isAdminRequest(request: Request) {
  return isAdminPassword(request.headers.get('x-admin-password'))
}

export function unauthorized() {
  return Response.json({ error: 'غير مصرح' }, { status: 401 })
}

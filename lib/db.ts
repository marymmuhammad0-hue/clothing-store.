import { Pool, type PoolClient, type QueryResultRow } from 'pg'

const globalForDb = globalThis as unknown as { coffeeStorePool?: Pool }

// The Neon integration injects NEON_DATABASE_URL; DATABASE_URL takes precedence when it is set.
const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

export const pool =
  globalForDb.coffeeStorePool ??
  new Pool({
    connectionString,
    max: 5,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.coffeeStorePool = pool

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params)
  return result.rows
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export type ProductRow = {
  id: number
  name: string
  subtitle: string
  price_base: number
  category: string
  image: string
  description: string
  stock: number
}

export type OrderRow = {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  status: string
  created_at: string
}

export type OrderItem = {
  id: number
  name: string
  image: string
  weight: string
  grind: string
  price: number
  qty: number
}

export function toProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    priceBase: row.price_base,
    category: row.category,
    image: row.image,
    description: row.description,
    stock: row.stock,
  }
}

export function toOrder(row: OrderRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    customer: { name: row.customer_name, phone: row.customer_phone, address: row.customer_address },
    items: row.items,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: row.status,
  }
}

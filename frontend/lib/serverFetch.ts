const serverApiUrl =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'

type NextInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] }
}

export async function serverFetch<T>(path: string, init?: NextInit): Promise<T> {
  const res = await fetch(`${serverApiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

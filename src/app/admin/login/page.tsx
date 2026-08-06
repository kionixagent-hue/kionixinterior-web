'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { loginAdmin } from './actions'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await loginAdmin(email, password)

    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? 'Email atau password salah.')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-section px-5">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border bg-white p-8"
      >
        <h1 className="font-serif text-2xl font-semibold text-bg-dark">Kionix Admin</h1>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-text-muted">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-text-muted">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
            className="rounded border border-border px-3 py-2 text-bg-dark outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-accent px-4 py-2 font-sans font-bold text-text-on-dark transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const roles = [
  { key: "investor", label: "Investor" },
  { key: "founder", label: "Startup Founder" },
]

export default function Page() {
  const router = useRouter()
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    if (!role) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to save role")
      router.push(data.redirect)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img alt="Logo" src="/favicon.ico" className="mx-auto h-12 w-auto" />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Select your role</h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          {roles.map((r) => (
            <label key={r.key} className={`flex items-center gap-3 rounded-md border p-4 cursor-pointer ${role === r.key ? "border-indigo-500" : "border-white/10"}`}>
              <input
                type="radio"
                name="role"
                value={r.key}
                checked={role === r.key}
                onChange={() => setRole(r.key)}
              />
              <span className="text-white">{r.label}</span>
            </label>
          ))}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={!role || loading}
            className="mt-4 flex w-full justify-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? "Continuing..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}

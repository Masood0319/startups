"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [enable2FA, setEnable2FA] = useState(false)
  const [secret, setSecret] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetch2FA = async () => {
      try {
        const res = await fetch("/api/auth/prepare-2fa")
        const data = await res.json()
        if (res.ok && data.success) {
          setSecret(data.secret)
          setQrDataUrl(data.qrDataUrl || "")
        }
      } catch {}
    }
    if (enable2FA && !secret) fetch2FA()
  }, [enable2FA, secret])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, is2FAEnabled: enable2FA, secretKey: enable2FA ? secret : undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Setup failed")
      router.push("/role")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img alt="Logo" src="/favicon.ico" className="mx-auto h-12 w-auto" />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Set your password</h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm/6 font-medium text-gray-100">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
          <div>
            <label className="block text-sm/6 font-medium text-gray-100">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="mt-2 block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="enable2fa" type="checkbox" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} />
            <label htmlFor="enable2fa" className="text-sm text-gray-100">Enable 2FA (Google Authenticator)</label>
          </div>

          {enable2FA && (
            <div className="rounded-md border border-white/10 p-4">
              <p className="text-sm text-gray-100 mb-2">Scan the QR in Google Authenticator or save the secret below.</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="2FA QR Code" className="mx-auto h-40 w-40 bg-white p-2 rounded" />
              ) : (
                <p className="text-xs text-gray-400">QR not available, use secret key manually.</p>
              )}
              {secret && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-400">Secret Key</label>
                  <input
                    readOnly
                    value={secret}
                    className="mt-1 block w-full rounded-md bg-white/5 px-3 py-1.5 text-xs text-white outline-1 -outline-offset-1 outline-white/10"
                  />
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}
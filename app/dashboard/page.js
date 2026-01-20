import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { redirect } from "next/navigation"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/login")
  }

  try {
    jwt.verify(token, JWT_SECRET)
  } catch {
    redirect("/login")
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome back! Your session is active.</p>
    </div>
  )
}
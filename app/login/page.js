"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Page() {

    const router = useRouter()

    const [formData, setFormData] = useState({ email: "", password: "" })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
                credentials: "include"
            })

            const data = await res.json()   // ✅ await here
            setLoading(false)

            // if(!res.ok){
            //     console.error("/login: Login request failed", data)
            // }

            if (res.ok && data.success) {
                try {
                    const meRes = await fetch('/api/auth/me', { 
                        method: "GET",
                        credentials: "include",
                        cache: 'no-store' })
                    const me = await meRes.json()
                    console.log("Auth check result:", me)
                    if (me?.authenticated) {
                        if (!me?.role) {
                            const targetPage = '/role'
                            console.log("Redirecting to:", targetPage)
                            router.push(targetPage)
                            return
                        }
                        if (me.role === 'investor') {
                            const targetPage = '/dashboard/investor'
                            console.log("Redirecting to:", targetPage)
                            router.push(targetPage)
                            return
                        }
                        if (me.role === 'founder') {
                            const targetPage = '/dashboard/founder'
                            console.log("Redirecting to:", targetPage)
                            router.push(targetPage)
                            return
                        }
                        const targetPage = '/dashboard'
                        console.log("Redirecting to:", targetPage)
                        router.push(targetPage)
                        return
                    } else {
                        console.log("Auth failed: cookie missing or expired")
                    }
                } catch (err){
                    console.error(err)
                    console.error("Error is inside the api/auth/me", err)
                 }
                // Fallback if session not readable
                const targetPage = '/dashboard'
                console.log("Redirecting to:", targetPage, "(fallback)")
                router.push(targetPage)
            } else {
                setError(data.message || "Login failed") // ✅ show error
            }
            console.log("Successfully logged in")
        } catch (err) {
            console.error(err)
            setLoading(false)
            setError("Something went wrong. Please try again.")
        }
    }

    // If already logged in, redirect to /dashboard immediately
    useEffect(() => {
        let active = true
        const check = async () => {
            try {
                const res = await fetch('/api/auth/me', { 
                    method: "GET",
                    credentials: "include",
                    cache: 'no-store'
                 })
                const data = await res.json()
                if (active && data?.authenticated) {
                    console.log("Redirect condition triggered")
                    router.replace('/dashboard')
                }
            } catch (_) { /* ignore */ }
        }
        check()
        return () => { active = false }
    }, [router])

    return (
        <>
            {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-900">
        <body class="h-full">
        ```
      */}
            <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img
                        alt="Your Company"
                        src="favicon.ico"
                        className="mx-auto h-12 rounded-xl w-auto"
                    />
                    <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    onChange={handleChange}
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
                                    Password
                                </label>

                            </div>
                            <div className="mt-2">
                                <input
                                    onChange={handleChange}
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                                />
                                <div className="text-sm pt-2">
                                    <Link href="forgot" className="font-semibold text-indigo-400 hover:text-indigo-300">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <p className='text-red-800 font-semibold text-center'>{error}</p>
                        <div>
                            <button
                                disabled={loading}
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            >
                                {loading ? "Logging in..." : "Log in"}
                            </button>
                        </div>
                    </form>

                    <p className="mt-10 text-center text-sm/6 text-gray-400">
                        Dont have an account?
                        <Link href="signup" className="font-semibold text-indigo-400 hover:text-indigo-300 pl-2">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </>
    )
}
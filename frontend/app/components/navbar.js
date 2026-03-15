"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { apiRequest } from '@/lib/apiClient'

const Navbar = () => {
  // Navbar State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [session, setSession] = useState({
    authenticated: false,
    role: null,        // ← removed TypeScript "as" assertion
    email: null,       // ← removed TypeScript "as" assertion
  });

  // Compute dashboard path safely (no TS types needed)
  const dashboardPath = session?.role === 'founder'
    ? '/dashboard/founder'
    : session?.role === 'investor'
    ? '/dashboard/investor'
    : '/dashboard';

  const initials = session?.email
    ? session.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'U';

  // Auth check
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await apiRequest('auth/me', { method: 'GET', cache: 'no-store' });
        const me = data?.data?.user;
        if (isMounted) {
          setSession({
            authenticated: !!(data?.success && me),
            role: me?.role || null,
            name: me?.full_name || me?.fullName || null,
            email: me?.email || null,
          });
        }
      } catch {
        if (isMounted) setSession({ authenticated: false, role: null, email: null });
      }
    };
    load();
    return () => { isMounted = false };
  }, []);

  const handleLogout = async () => {
    await apiRequest('auth/logout', { method: 'POST', data: {} }).catch(() => {});
    window.location.href = '/';
  };

  const publicLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Startups', href: '/startups' },
    { name: 'Notifications', href: '/notifications' },
    { name: 'Messaging', href: '/messaging'}
  ];

  const authedLinks = [...publicLinks, { name: 'Dashboard', href: dashboardPath }];

  return (
    <>
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-transparent backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/home" className="-m-1.5 p-1.5 flex items-center gap-3">
              <img alt="Logo" src="/favicon.ico" className="h-9 w-9 rounded-lg" />
              <span className="text-xl font-bold text-white">Travest</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-300"
            >
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-10 font-semibold">
            {publicLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-4">
            {!session.authenticated ? (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="relative pl-5">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-full bg-white/10 px-2  py-2 hover:bg-white/20 transition"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {initials}
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-black shadow-2xl">
                    <Link href={dashboardPath} className="block px-4 py-3 text-sm hover:bg-white/10" onClick={() => setProfileOpen(false)}>
                      Dashboard
                    </Link>
                    <Link href="/profile" className="block px-4 py-3 text-sm hover:bg-white/10" onClick={() => setProfileOpen(false)}>
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black/80" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full max-w-xs overflow-y-auto bg-black px-6 py-6">
            <div className="flex items-center justify-between">
              <Link href="/home" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                <img alt="Logo" src="/favicon.ico" className="h-9 w-9 rounded-lg" />
                <span className="sr-only">Travest</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-400"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-8 flow-root">
              <div className="-my-6 divide-y divide-gray-800">
                <div className="space-y-2 py-6">
                  {(session.authenticated ? authedLinks : publicLinks).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-medium text-gray-300 hover:bg-white/10"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="py-6">
                  {!session.authenticated ? (
                    <div className="space-y-4">
                      <Link href="/login" className="block text-base font-medium text-gray-300" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block rounded-lg bg-indigo-600 px-5 py-3 text-center text-base font-semibold text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                          {initials}
                        </div>
                        <span className="text-sm text-gray-400">{session.name}</span>
                      </div>
                      <Link href={dashboardPath} className="block py-2 text-base font-medium" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left text-base font-medium text-red-400">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
      </>
  )
}

export default Navbar

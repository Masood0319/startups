// app/page.tsx   (or wherever your combined hero + navbar lives)
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
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
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        if (isMounted) {
          setSession({
            authenticated: !!data?.authenticated,
            role: data?.role || null,
            name: data?.full_name || null,
            email: data?.email || null,
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
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
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

      {/* Hero Section (unchanged – already perfect) */}
      <div className="relative isolate overflow-hidden bg-gray-900">
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-32 sm:py-48 lg:py-56">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-10">
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-4 py-2 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20">
                Early access live — join 500+ investors & founders
              </span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Your Gateway to <span className="text-indigo-400">Smarter Decisions</span>
            </h1>
            <p className="mt-8 text-lg leading-8 text-gray-300 sm:text-xl">
              From first-time investors to seasoned traders, we&apos;re building the collaborative platform
              where great startups meet great capital — smarter, faster, together.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/onboarding/founder"
                className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-indigo-500 transition transform hover:scale-105"
              >
                Launch Your Startup
              </Link>
              <Link
                href="/onboarding/investor"
                className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-gray-900 shadow-lg hover:bg-gray-100 transition transform hover:scale-105"
              >
                Invest in the Future
              </Link>
            </div>

            <p className="mt-10 text-sm text-gray-400">
              Trusted by <span className="font-bold text-white">500+</span> founders and investors worldwide
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
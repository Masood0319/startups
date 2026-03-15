"use client"

import Link from "next/link"
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaGithub } from "react-icons/fa"

export default function Page() {
  return (
    <footer className="bg-gray-900 text-gray-400 border-t">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 lg:px-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h2 className="text-white text-2xl font-bold">Travest</h2>
            <p className="mt-4 text-sm leading-6">
              Your gateway to smarter decisions.  
              Connecting startups with investors to build the future together.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/companies" className="hover:text-white">Companies</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-white">About us</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between">
          {/* Copyright */}
          <p className="text-sm">&copy; {new Date().getFullYear()} Travest. All rights reserved.</p>

          {/* Social Links */}
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaFacebookF size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaTwitter size={18} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaLinkedinIn size={18} />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaGithub size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

import Link from 'next/link'
import { Home, LogIn } from 'lucide-react'
import MainLogo from './mainlogo'

export default function Dashboard() {
  return (
    <div className="w-64 bg-white p-4 flex flex-col shadow-md min-h-screen">
      <div className="flex items-center gap-2 mb-2">
        <div className="scale-100 transform-origin-left">
          <MainLogo />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      </div>
      <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-2">
        <Home className="mr-2" />
        Home
      </Link>
      <Link href="/login" className="flex items-center text-gray-600 hover:text-gray-800">
        <LogIn className="mr-2" />
        Login
      </Link>
    </div>
  )
}

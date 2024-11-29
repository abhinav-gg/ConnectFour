'use client'

import Link from 'next/link'
import { Home, LogIn } from 'lucide-react'

export default function Register() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle registration logic here
    console.log('Registration submitted')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Dashboard */}
      <div className="w-64 bg-white p-4 flex flex-col shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-2">
          <Home className="mr-2" />
          Home
        </Link>
        <Link href="/login" className="flex items-center text-gray-600 hover:text-gray-800">
          <LogIn className="mr-2" />
          Login
        </Link>
      </div>

      {/* Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Register</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" id="username" name="username" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" name="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" id="password" name="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
              Register
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-600">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
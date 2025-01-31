'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getConfig } from '@/config/env'
import Dashboard from '@/components/dashboard'
import { ReCaptchaWrapper } from '@/components/captcha';
import { useReCaptcha } from '@/components/usecaptcha';

export default function Login() {
  return (
  <ReCaptchaWrapper>
    <LoginPage />
  </ReCaptchaWrapper>
  )
}

function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const handleReCaptcha = useReCaptcha('login')

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const config = getConfig()
        const response = await fetch(`${config.backendUrl}/api/auth/protected-route`, {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          router.push('/dashboard') // Redirect to dashboard or another page after login
        }
      } catch (err) {
        console.error(err)
      }
    }

    checkLoginStatus()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const token = await handleReCaptcha()
    if (!token) {
      setError('ReCaptcha verification failed')
      return
    }

    try {
      const config = getConfig()
      const response = await fetch(`${config.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          token,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json();
      
      router.push('/dashboard') // Redirect to dashboard or another page after login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Dashboard/>
      <div className="w-full h-full items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Login</h1>
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
              Log In
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-600">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
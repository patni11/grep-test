'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RepositoriesList } from '@/components/RepositoriesList'

export default function Home() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleGitHubSignIn = async () => {
    setLoading(true)
    try {
      await signIn('github', { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {session ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-black mb-4">
                Welcome {session.user.name}
              </h2>
              <p className="text-gray-600 text-lg">
                Below are your repositories and their change logs
              </p>
            </div>

            {/* Repositories */}
            <RepositoriesList />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex">
          {/* Left Side - Background Image */}
          <div 
            className="w-3/5 relative bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/koi.png')`,
            }}
          >
            {/* Quote Overlay */}
            <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm rounded-lg p-6 max-w-md shadow-lg">
              <p className="text-gray-800 text-sm mb-3 italic">
                "Talk is cheap. Show me the code."
              </p>
              <p className="text-gray-600 text-sm font-medium">
                — Linus Torvalds
              </p>
            </div>

            {/* Brand Header */}
            <div className="absolute top-8 left-8">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
                Delta
              </h1>
              <p className="text-white/90 text-lg font-light drop-shadow-md">
                Generate change logs in one click
              </p>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="w-2/5 bg-white flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Sign In
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter your details to Sign In
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleGitHubSignIn}
                  disabled={loading}
                  className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 flex items-center justify-center gap-3 font-medium"
                  variant="outline"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {loading ? 'Signing in...' : 'GitHub'}
                </Button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  By clicking continue, you agree to our{' '}
                  <a href="#" className="text-gray-700 underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-gray-700 underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

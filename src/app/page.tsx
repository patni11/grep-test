'use client'

import { useSession, signOut, signIn } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { data: session, status } = useSession()
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-8">
          <div className="flex justify-between items-center border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold text-black">
              App Dashboard
            </h1>
            {session && (
              <Button
                onClick={() => signOut()}
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Sign Out
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12">
          {session ? (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center">
                <h2 className="text-4xl font-bold text-black mb-4">
                  Welcome back, {session.user.name}
                </h2>
                <p className="text-gray-600 text-lg">
                  You're successfully signed in with GitHub
                </p>
              </div>

              {/* User Profile Card */}
              <Card className="border-black">
                <CardHeader>
                  <CardTitle className="text-black">User Profile</CardTitle>
                  <CardDescription>Your GitHub account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-16 h-16 rounded-full border-2 border-black"
                      />
                    )}
                    <div>
                      <p className="text-xl font-semibold text-black">
                        {session.user.name}
                      </p>
                      <p className="text-gray-600">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-black">
                  <CardHeader>
                    <CardTitle className="text-black">Database</CardTitle>
                    <CardDescription>MongoDB Integration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Seamless MongoDB connection with session management
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-black">
                  <CardHeader>
                    <CardTitle className="text-black">Authentication</CardTitle>
                    <CardDescription>GitHub OAuth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Secure OAuth authentication with GitHub
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-black">
                  <CardHeader>
                    <CardTitle className="text-black">Modern UI</CardTitle>
                    <CardDescription>Clean Design</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Minimalist design with shadcn components
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md border-black">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-black">Welcome</CardTitle>
                  <CardDescription>
                    Sign in with your GitHub account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleGitHubSignIn}
                    disabled={loading}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {loading ? 'Signing in...' : 'Sign in with GitHub'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

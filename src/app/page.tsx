'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Next.js + MongoDB + GitHub Auth
            </h1>
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Welcome to Your App
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              A modern Next.js application with MongoDB and GitHub authentication
            </p>
          </div>

          {session ? (
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  User Profile
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Session Info:</h4>
                    <pre className="text-sm text-gray-600 overflow-auto">
                      {JSON.stringify(session, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Get Started
                </h3>
                <p className="text-gray-600 mb-6">
                  Sign in with your GitHub account to access your profile and data
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
                >
                  Sign In with GitHub
                </Link>
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-blue-600 mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  MongoDB Integration
                </h4>
                <p className="text-gray-600">
                  Seamless MongoDB connection with session management and user data persistence
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-green-600 mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  GitHub Authentication
                </h4>
                <p className="text-gray-600">
                  Secure OAuth authentication with GitHub using NextAuth.js
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-purple-600 mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Modern UI
                </h4>
                <p className="text-gray-600">
                  Beautiful, responsive design built with Tailwind CSS and modern UX practices
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

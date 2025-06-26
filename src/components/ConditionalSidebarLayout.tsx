'use client'

import { useSession } from 'next-auth/react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export function ConditionalSidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!session) {
    // No sidebar for unauthenticated users
    return <>{children}</>
  }

  // Show sidebar for authenticated users
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        <div className="border-b border-gray-200 p-4 bg-white">
          <SidebarTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-black hover:text-white h-9 px-4 py-2" />
        </div>
        <div className="p-4">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
} 
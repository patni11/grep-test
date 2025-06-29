'use client'

import { Home, LogOut, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function AppSidebar() {
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut()
  }

  return (
    <Sidebar className="border-r-2 border-black">
      <SidebarHeader className="border-b border-black p-4">
        <h2 className="text-lg font-bold text-black">Delta</h2>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-black font-semibold text-lg mb-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-black hover:text-white p-2">
                  <Link href="/">
                    <Home className="w-8 h-8" />
                    <span className="text-md font-semibold">Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-black p-4">
        {session?.user && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-black"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-black truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-black hover:bg-black hover:text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-black hover:bg-black hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
} 
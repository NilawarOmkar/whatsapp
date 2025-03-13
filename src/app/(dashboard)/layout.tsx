import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import '../globals.css'
import { Inter } from 'next/font/google'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from 'sonner'
import LogoutButton from '@/components/LogoutButton'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar className="fixed left-0 top-0 h-screen w-64 border-r" />
      <main className={`${inter.className} flex flex-col w-full min-h-screen`}>
        <div className="flex justify-between items-center p-1 border-b">
          <SidebarTrigger />
          <LogoutButton />
        </div>
        {children}
        <Toaster />
      </main>
      <Toaster />
    </SidebarProvider>
  )
}


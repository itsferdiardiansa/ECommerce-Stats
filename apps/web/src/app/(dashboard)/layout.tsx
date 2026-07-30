import { cookies } from 'next/headers'
import React from 'react'
import AppSidebar from '@/components/layout/AppSidebar'
import Header from '@/components/layout/Header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import PageContainer from '@/components/layout/PageContainer'
import { RequireAuth } from '@/features/auth/components/RequireAuth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <RequireAuth>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <PageContainer>{children}</PageContainer>
        </SidebarInset>
      </SidebarProvider>
    </RequireAuth>
  )
}

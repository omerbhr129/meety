import type { AppProps } from 'next/app'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from '../components/ui/toaster'
import '../styles/globals.css'
import { AuthProvider } from '../lib/auth'
import Sidebar from '../components/Sidebar'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth'
import { useState } from 'react'
import { PageTransition } from '../components/PageTransition'

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const isBookingPage = router.pathname.startsWith('/book/')
  const isLoginPage = router.pathname === '/'
  const isBookingSuccess = router.pathname === '/booking-success'

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
  }

  const mainClasses = [
    'transition-all duration-500 ease-in-out flex-1',
    !isBookingPage && !isLoginPage && !isBookingSuccess && user && [
      'p-8',
      isSidebarCollapsed ? 'mr-20' : 'mr-64'
    ]
  ].flat().filter(Boolean).join(' ')

  const containerClasses = [
    'min-h-screen flex flex-col',
    !isLoginPage && 'bg-gradient-to-br from-blue-50 to-indigo-100'
  ].filter(Boolean).join(' ')

  const contentClasses = [
    'flex flex-col min-h-screen',
    !isLoginPage && 'relative z-10'
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {!isBookingPage && !isLoginPage && !isBookingSuccess && user && (
          <Sidebar onCollapse={handleSidebarCollapse} />
        )}
        <main className={mainClasses}>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={router.pathname}>
              <Component {...pageProps} />
            </PageTransition>
          </AnimatePresence>
        </main>
        <Toaster />
      </div>
    </div>
  )
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  )
}

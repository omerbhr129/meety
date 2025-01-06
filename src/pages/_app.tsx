import type { AppProps } from 'next/app'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from '../components/ui/toaster'
import '../styles/globals.css'
import { AuthProvider } from '../lib/auth'
import Sidebar from '../components/Sidebar'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth'
import { useState, useEffect } from 'react'
import { PageTransition } from '../components/PageTransition'
import { LoadingSpinner } from '../components/ui/loading-spinner'
import { GoogleOAuthProvider } from '@react-oauth/google';


function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isBookingPage = router.pathname.startsWith('/book/')
  const isLoginPage = router.pathname === '/'
  const isBookingSuccess = router.pathname === '/booking-success'

  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
  }

  const mainClasses = [
    'transition-all duration-500 ease-in-out flex-1 pb-24',
    !isBookingPage && !isLoginPage && !isBookingSuccess && user && [
      'p-8',
      isSidebarCollapsed ? 'mr-20' : 'mr-64'
    ]
  ].flat().filter(Boolean).join(' ')

  const containerClasses = [
    'min-h-full w-full',
    !isLoginPage && 'bg-gradient-to-br from-blue-50 to-indigo-100 fixed inset-0'
  ].filter(Boolean).join(' ')

  const contentClasses = [
    'flex flex-col min-h-screen overflow-auto',
    !isLoginPage && 'relative z-10'
  ].filter(Boolean).join(' ')

  return (
    <>
      <div className={containerClasses} />
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
        {isLoading && <LoadingSpinner />}
      </div>
    </>
  )
}

export default function App(props: AppProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    const publicRoutes = ['/', '/login', '/register']
    
    if (!token && !publicRoutes.includes(router.pathname)) {
      router.push('/')
    }
  }, [router.pathname, router]) // הוספת router לתלויות

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  )
}
import { Eye, EyeOff } from "lucide-react"
import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react"
import { useRouter } from 'next/router'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useToast } from "../components/ui/use-toast"
import { useAuth } from "../lib/auth"
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { register } from "../services/api"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login, googleSignIn } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const logoRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current) return

      const rect = logoRef.current.getBoundingClientRect()

      // Calculate relative position within the element (0-100%)
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Add some smoothing and clamping
      const smoothX = Math.max(0, Math.min(100, x))
      const smoothY = Math.max(0, Math.min(100, y))

      requestAnimationFrame(() => {
        if (logoRef.current) {
          logoRef.current.style.setProperty('--mouse-x', `${smoothX}%`)
          logoRef.current.style.setProperty('--mouse-y', `${smoothY}%`)
        }
      })
    }

    const handleMouseLeave = () => {
      if (!logoRef.current) return

      // Animate back to center when mouse leaves
      logoRef.current.style.setProperty('--mouse-x', '50%')
      logoRef.current.style.setProperty('--mouse-y', '50%')
    }

    const logo = logoRef.current
    if (logo) {
      logo.addEventListener('mousemove', handleMouseMove)
      logo.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (logo) {
        logo.removeEventListener('mousemove', handleMouseMove)
        logo.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "יש למלא את כל השדות החובה"
      })
      setLoading(false)
      return
    }

    if (!isLogin && (!formData.fullName || formData.password !== formData.confirmPassword)) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: !formData.fullName ? "יש למלא שם מלא" : "הסיסמאות אינן תואמות"
      })
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        console.log('Attempting login with:', formData.email);
        await login(formData.email, formData.password)
        toast({
          title: "הצלחה!",
          description: "התחברת בהצלחה!"
        })
        router.push('/dashboard')
      } else {
        // Handle registration
        console.log('Attempting registration with:', formData.email);
        const response = await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        })

        // After successful registration, log the user in
        await login(formData.email, formData.password)
        toast({
          title: "הצלחה!",
          description: "נרשמת והתחברת בהצלחה!"
        })
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Error:', err)
      let errorMessage = "שגיאה בפעולה, אנא נסה שוב"

      if (axios.isAxiosError(err) && err.response?.data?.message) {
        if (err.response.data.message === 'Invalid credentials') {
          errorMessage = "שם משתמש או סיסמה שגויים"
        } else if (err.response.data.message === 'Email already exists') {
          errorMessage = "כתובת האימייל כבר קיימת במערכת"
        } else {
          errorMessage = err.response.data.message
        }
      }

      toast({
        variant: "destructive",
        title: "שגיאה",
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await googleSignIn();
      toast({
        title: "הצלחה!",
        description: "התחברת בהצלחה באמצעות Google!"
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בהתחברות עם Google. אנא נסה שנית."
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`${isLogin ? 'התחברות' : 'הרשמה'} | Meety`}</title>
      </Head>
      <div
        className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
        dir="rtl"
      >
        <div className="w-full max-w-lg px-6">
          <div className="text-center mb-12">
            <div className="pb-2">
              <h1 ref={logoRef} className="text-6xl font-bold tracking-tight leading-none logo-hover mb-6 py-2">
                .Meety
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                נהל את הפגישות שלך בצורה חכמה ויעילה
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto">
            <div className="flex gap-4 mb-10 border-b">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 pb-4 transition-all text-lg ${isLogin
                  ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
                type="button"
              >
                התחברות
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 pb-4 transition-all text-lg ${!isLogin
                  ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
                type="button"
              >
                הרשמה
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="שם מלא"
                  className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base text-gray-600 placeholder:text-gray-400"
                  required
                  disabled={loading}
                />
              )}

              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="אימייל"
                className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base text-gray-600 placeholder:text-gray-400"
                required
                disabled={loading}
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="סיסמה"
                  className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base text-gray-600 placeholder:text-gray-400"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-6 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="אימות סיסמה"
                    className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base text-gray-600 placeholder:text-gray-400"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              )}

              <div className="flex justify-start text-sm">
                {isLogin && (
                  <Link
                    href="/reset-password"
                    className="text-blue-600 hover:text-blue-700 transition-colors mr-1">
                    שכחת סיסמה?
                  </Link>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-2xl transition-all disabled:opacity-50 mt-5 font-medium text-lg shadow-lg shadow-blue-500/30"
              >
                {loading ? "מעבד..." : isLogin ? "התחבר" : "הרשמה"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2"
              >
                {googleLoading ? (
                  "מתחבר..."
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="google"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 488 512"
                    >
                      <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                      ></path>
                    </svg>
                    המשך עם Google
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

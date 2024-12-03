import { Eye, EyeOff } from "lucide-react"
import React, { useState, ChangeEvent, FormEvent } from "react"
import { useRouter } from 'next/router'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useToast } from "../components/ui/use-toast"
import { useAuth } from "../lib/auth"
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

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

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות"
      })
      setLoading(false)
      return
    }

    try {
      console.log('Attempting login with:', formData.email);
      await login(formData.email, formData.password)
      toast({
        title: "הצלחה!",
        description: "התחברת בהצלחה!"
      })
      router.push('/dashboard')
    } catch (err) {
      console.error('Error:', err)
      let errorMessage = "שגיאה בפעולה, אנא נסה שוב"
      
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        if (err.response.data.message === 'Invalid credentials') {
          errorMessage = "שם משתמש או סיסמה שגויים"
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

  return (
    <>
      <Head>
        <title>{`${isLogin ? 'התחברות' : 'הרשמה'} | Meety`}</title>
      </Head>
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center"
        dir="rtl"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="pb-4">
              <h1 className="text-6xl font-bold tracking-tight leading-relaxed">
                <span className="mr-1 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 text-transparent bg-clip-text">
                  .
                </span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                  Meety
                </span>
              </h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex gap-4 mb-8 border-b">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 pb-4 transition-all ${
                  isLogin
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                type="button"
              >
                התחברות
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 pb-4 transition-all ${
                  !isLogin
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                type="button"
              >
                הרשמה
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="שם מלא"
                  className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-600 placeholder:text-gray-400"
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
                className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-600 placeholder:text-gray-400"
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
                  className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-600 placeholder:text-gray-400"
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
                    className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-600 placeholder:text-gray-400"
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl transition-all disabled:opacity-50 mt-6 font-medium text-lg shadow-lg shadow-blue-500/30"
              >
                {loading ? "מעבד..." : isLogin ? "התחבר" : "הרשמה"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

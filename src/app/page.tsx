"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/shared/auth-provider"
import { BookOpenCheck } from "lucide-react"

export default function Index() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (profile?.role === 'admin') {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, profile, loading, router])

  return (
    <div className="flex h-screen items-center justify-center bg-grid bg-radial-glow relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/3 -right-32 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-pulse-glow">
          <BookOpenCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold gradient-text">ExamPortal</h1>
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    </div>
  )
}

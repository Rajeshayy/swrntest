"use client"

import { LogOut, User } from "lucide-react"
import { auth } from "@/lib/firebase/client"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/shared/auth-provider"

export function UserMenu() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Sign out error", error)
    }
  }

  return (
    <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-slate-100 group">
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm overflow-hidden uppercase">
        {profile?.name?.[0] || auth.currentUser?.email?.[0] || <User className="w-5 h-5" />}
      </div>
      <div className="hidden sm:block text-left mr-2">
        <p className="text-sm font-black text-slate-900 leading-none mb-0.5 truncate max-w-[120px]">
          {profile?.name || auth.currentUser?.displayName || "User"}
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[120px]">
          {profile?.role === 'student' ? (profile?.registrationNumber || "ID Found") : auth.currentUser?.email}
        </p>
      </div>
      <button
        onClick={handleSignOut}
        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}

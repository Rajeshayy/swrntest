"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, BookOpen, FileText, LogOut, BookOpenCheck, Sparkles, ChevronRight } from "lucide-react"
import { auth } from "@/lib/firebase/client"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/shared/auth-provider"
import { cn } from "@/lib/utils"

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Tests", href: "/admin/tests", icon: BookOpen },
  { name: "Results", href: "/admin/results", icon: FileText },
]

const studentNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tests", href: "/tests", icon: BookOpen },
  { name: "Test History", href: "/results", icon: FileText },
]

export function Sidebar({ role }: { role: "admin" | "student" }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()

  const navItems = role === "admin" ? adminNavItems : studentNavItems

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="w-72 min-h-screen bg-slate-50 border-r border-slate-200/60 flex flex-col relative">
      {/* Branding */}
      <div className="p-8 pb-10">
        <Link href={role === "admin" ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-indigo-100 ring-4 ring-indigo-50/50 group-hover:scale-105 transition-transform duration-300">
            <BookOpenCheck className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ExamPortal</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{role}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5">
        <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group",
                isActive
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )} />
                {item.name}
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Account */}
      <div className="p-4 mt-auto">
        <div className="bg-white rounded-3xl p-4 border border-slate-200/60 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm uppercase">
               {profile?.name?.[0] || auth.currentUser?.email?.[0] || "U"}
            </div>
            <div className="overflow-hidden">
               <p className="text-sm font-bold text-slate-900 truncate">{profile?.name || auth.currentUser?.displayName || "User"}</p>
               <p className="text-[11px] text-slate-400 font-medium truncate">
                {role === 'student' ? (profile?.registrationNumber || "ID Not Found") : auth.currentUser?.email}
               </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}

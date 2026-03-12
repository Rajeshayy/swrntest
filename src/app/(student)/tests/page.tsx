"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/shared/auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, BookOpen, Sparkles, ChevronRight, AlertCircle, Timer } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function TestsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    const fetchTests = async () => {
      try {
        const q = query(collection(db, "tests"), orderBy("start_time", "asc"))
        const snapshot = await getDocs(q)
        const testsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          start_time: doc.data().start_time?.toDate ? doc.data().start_time.toDate() : new Date(doc.data().start_time)
        }))
        setTests(testsData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [user, authLoading, router])

  if (loading || authLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Examinations...</p>
        </div>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="space-y-10 animate-slide-up p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest leading-none">Curriculum</div>
             <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Examination Schedule</h2>
          <p className="text-slate-500 font-medium mt-1">Review your upcoming assessments and take active tests.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm">
           <div className="text-right border-r border-slate-100 pr-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tests</p>
              <p className="text-sm font-bold text-slate-900">{tests.filter(t => {
                 const start = t.start_time;
                 const end = new Date(start.getTime() + t.duration_minutes * 60000);
                 return start <= now && end >= now;
              }).length}</p>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Scheduled</p>
              <p className="text-sm font-bold text-slate-900">{tests.length}</p>
           </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 pb-10">
        {tests.map((test, index) => {
          const startTime = test.start_time
          const endTime = new Date(startTime.getTime() + test.duration_minutes * 60000)
          const isUpcoming = startTime > now
          const isOngoing = startTime <= now && endTime >= now
          const isPast = endTime < now

          return (
            <div 
              key={test.id} 
              className={cn(
                "group relative bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col animate-slide-up",
                isOngoing && "ring-4 ring-indigo-100/50 border-indigo-200 shadow-indigo-100/30"
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Status Header */}
              <div className="flex items-center justify-between mb-8">
                 <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                    isOngoing ? "bg-indigo-600 text-white animate-pulse-glow" : "bg-slate-50 text-slate-400 border border-slate-200/50"
                 )}>
                    <BookOpen className="w-6 h-6" />
                 </div>
                 
                 <div className={cn(
                    "px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border",
                    isOngoing ? "bg-emerald-50 text-emerald-600 border-emerald-100/60 animate-pulse" :
                    isUpcoming ? "bg-amber-50 text-amber-600 border-amber-100/60" : "bg-slate-50 text-slate-400 border-slate-200/60"
                 )}>
                    {isOngoing ? "• Active Now" : isUpcoming ? "Upcoming" : "Completed"}
                 </div>
              </div>

              {/* Title & Description */}
              <div className="flex-1">
                 <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">
                    {test.title}
                 </h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 line-clamp-2">
                    {test.description || "A comprehensive assessment designed to evaluate your mastery of the subject matter."}
                 </p>

                 {/* Metrics */}
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors duration-300">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Schedule</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold text-xs truncate">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </div>
                    </div>
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors duration-300">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Duration</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold text-xs truncate">
                          <Timer className="w-3.5 h-3.5 text-indigo-400" />
                          {test.duration_minutes} Minutes
                       </div>
                    </div>
                 </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-slate-50">
                {isOngoing ? (
                  <Link href={`/tests/${test.id}`} className="block">
                    <button className="w-full h-14 rounded-[1.2rem] gradient-primary text-white font-extrabold text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group/btn">
                       Enter Portal
                       <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                ) : isUpcoming ? (
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Unlocking In</p>
                      <p className="text-sm font-extrabold text-slate-600">
                         {Math.round((startTime.getTime() - now.getTime()) / 60000)} Minutes
                      </p>
                   </div>
                ) : (
                  <button className="w-full h-14 rounded-[1.2rem] bg-slate-100 text-slate-400 font-extrabold text-xs uppercase tracking-widest cursor-not-allowed border border-slate-200/50">
                    Evaluation Period Closed
                  </button>
                )}
              </div>
              
              {/* Question count decorator */}
              <div className="absolute -bottom-3 right-8 px-4 py-1.5 bg-slate-900 rounded-full text-[10px] font-bold text-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                 {test.total_questions || 0} Questions Total
              </div>
            </div>
          )
        })}
        
        {tests.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Assessments Found</h3>
             <p className="text-slate-400 font-medium">Your curriculum currently has no scheduled tests.</p>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/shared/auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { FileText, Sparkles, ChevronRight, BarChart3, Calendar, Award, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ResultsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    const fetchAttempts = async () => {
      try {
        const q = query(
          collection(db, "testAttempts"),
          where("userId", "==", user.uid),
          orderBy("submittedAt", "desc")
        )
        const snapshot = await getDocs(q)
        const attemptsData = await Promise.all(snapshot.docs.map(async (aDoc) => {
          const aData = aDoc.data()
          const testDoc = await getDoc(doc(db, "tests", aData.testId))
          return {
            id: aDoc.id,
            ...aData,
            tests: testDoc.data(),
            submitted_at: aData.submittedAt?.toDate()?.toISOString()
          }
        }))
        setAttempts(attemptsData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAttempts()
  }, [user, authLoading, router])

  if (loading || authLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving Analytics...</p>
        </div>
      </div>
    )
  }

  // Calculate average performance
  const avgPerformance = attempts.length > 0
    ? Math.round(attempts.reduce((acc, curr) => {
        const pct = curr.tests?.total_questions > 0 ? (curr.score / curr.tests.total_questions) * 100 : 0
        return acc + pct
      }, 0) / attempts.length)
    : 0

  return (
    <div className="space-y-10 animate-slide-up p-4">
      {/* Header & Stats Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest leading-none">Performance</div>
             <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Academic Results</h2>
          <p className="text-slate-500 font-medium mt-1">Detailed history of your assessment performances.</p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 min-w-[200px]">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  <FileText className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tests Taken</p>
                  <p className="text-2xl font-extrabold text-slate-900">{attempts.length}</p>
               </div>
            </div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-md overflow-hidden p-1">
         <div className="flex items-center justify-between p-8 pb-4 bg-slate-50/50">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <Calendar className="w-4 h-4 text-indigo-500" />
               Submission History
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort: Latest First</span>
         </div>
         
         <div className="p-4 space-y-4">
            {attempts.map((attempt: any, index: number) => {
               const pct = attempt.tests.total_questions > 0 
                  ? Math.round((attempt.score / attempt.tests.total_questions) * 100) 
                  : 0
               return (
                  <div 
                    key={attempt.id} 
                    className="group bg-white rounded-[1.8rem] p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                           <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                              pct >= 70 ? "bg-emerald-500 shadow-emerald-100" : 
                              pct >= 40 ? "bg-amber-500 shadow-amber-100" : "bg-red-500 shadow-red-100"
                           )}>
                              <BarChart3 className="w-6 h-6" />
                           </div>
                           <div>
                              <h4 className="text-[17px] font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                 {attempt.tests.title}
                              </h4>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                                 <Calendar className="w-3.5 h-3.5" />
                                 {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently Taken"}
                              </p>
                           </div>
                        </div>

                         <div className="flex items-center gap-12 pr-4">
                           <Link href={`/results/${attempt.id}`}>
                              <button className="h-12 px-6 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 group/btn shadow-sm active:scale-95">
                                 View Test Details
                                 <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                           </Link>
                        </div>
                     </div>
                  </div>
               )
            })}

            {attempts.length === 0 && (
               <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No result records found</p>
                  <p className="text-slate-300 text-xs font-medium mt-1">Complete an examination to see your statistics.</p>
               </div>
            )}
         </div>
      </div>

      {/* Encouragement Banner */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-100 overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-700" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
               <h3 className="text-2xl font-extrabold mb-2">Want to improve your scores?</h3>
               <p className="text-indigo-100/70 font-medium leading-relaxed">Review your past answers in the details view to understand where you can grow. Personalized study paths are coming soon!</p>
            </div>
            <Link href="/tests">
               <button className="h-14 px-8 rounded-2xl bg-white text-indigo-600 font-extrabold text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95">
                  Explore More Tests
               </button>
            </Link>
         </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/shared/auth-provider"
import { db } from "@/lib/firebase/client"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, XCircle, Sparkles, Award, Calendar, BookOpen, ChevronRight, HelpCircle, Trophy, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ResultDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [attempt, setAttempt] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const attemptId = params.id as string

        const attemptDoc = await getDoc(doc(db, "testAttempts", attemptId))
        if (!attemptDoc.exists()) {
          setLoading(false)
          return
        }
        const attemptData = { id: attemptDoc.id, ...attemptDoc.data() } as any

        if (!attemptData.testId || !attemptData.userId) {
          console.error("Missing testId or userId in attempt data")
          setLoading(false)
          return
        }

        const [testDoc, profileDoc] = await Promise.all([
          getDoc(doc(db, "tests", attemptData.testId)),
          getDoc(doc(db, "profiles", attemptData.userId))
        ])
        
        const fullAttempt = {
          ...attemptData,
          tests: testDoc.data(),
          profiles: profileDoc.data(),
          submitted_at: (attemptData as any).submittedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }
        setAttempt(fullAttempt)

        const answersSnapshot = await getDocs(collection(db, "testAttempts", attemptId, "answers"))
        const answersData = await Promise.all(answersSnapshot.docs.map(async (aDoc) => {
          const aData = aDoc.data()
          try {
             const qDoc = await getDoc(doc(db, "questions", aDoc.id))
             const qData = qDoc.exists() ? qDoc.data() : null
             
             if (!qData) {
                // Fallback attempt: maybe it's in the subcollection (older schema)
                const subQDoc = await getDoc(doc(db, "tests", attemptData.testId, "questions", aDoc.id))
                return {
                  selected_option: aData.selectedOption,
                  questions: subQDoc.data()
                }
             }

             return {
               selected_option: aData.selectedOption,
               questions: qData
             }
          } catch (e) {
             return { selected_option: aData.selectedOption, questions: null }
          }
        }))
        setAnswers(answersData.filter(a => a.questions))

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, params.id, router])

  if (loading || authLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Scores...</p>
        </div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 scale-in">
        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
           <XCircle className="w-10 h-10 text-slate-200" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Result Record Not Found</h2>
        <p className="text-slate-400 font-medium mb-8">The requested examination result could not be located in the system.</p>
        <Link href="/dashboard">
          <Button className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-black font-bold text-white transition-all shadow-lg active:scale-95">
             Back to Portal
          </Button>
        </Link>
      </div>
    )
  }

  const percentage = attempt.tests.total_questions > 0 
    ? Math.round((attempt.score / attempt.tests.total_questions) * 100) 
    : 0

   return (
    <div className="max-w-6xl mx-auto space-y-12 p-4 pb-20 animate-slide-up">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
         <Link href="/results">
            <button className="flex items-center gap-2 group px-4 py-2 hover:bg-slate-100 rounded-2xl transition-all">
               <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
               <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Back to History</span>
            </button>
         </Link>
      </div>
 
      {/* Hero Header - Metadata Only */}
      <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-indigo-50 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-32 bg-indigo-50/50 rounded-full blur-3xl -z-10 transition-transform duration-700 group-hover:scale-110" />
         
         <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex-1 text-center lg:text-left">
               <div className="inline-flex items-center gap-2 mb-4 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Test Completed Successfully</span>
               </div>
               <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                  {attempt.tests.title}
               </h1>
               <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-400 font-bold text-sm uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-indigo-400" />
                     {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}
                  </div>
                  <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4 text-indigo-400" />
                     {attempt.tests.duration_minutes} Minutes Duration
                  </div>
               </div>
               <p className="mt-8 text-slate-500 font-medium max-w-2xl leading-relaxed">
                  {attempt.tests.description || "You have successfully submitted your responses for this assessment. Your completion record has been logged in the system."}
               </p>
            </div>
 
             <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-white shadow-inner flex flex-col items-center text-center">
               <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-indigo-600 flex items-center justify-center shadow-xl">
                     <span className="text-3xl font-black text-slate-900">{percentage}%</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg border-2 border-white">
                     <Award className="w-4 h-4" />
                  </div>
               </div>
               <h4 className="text-lg font-black text-slate-900 mb-1">Score: {attempt.score} / {attempt.tests.total_questions}</h4>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Examination Performance</p>
            </div>
         </div>
      </div>

      {/* Answer Analysis Section */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Answer Analysis</h3>
               <p className="text-slate-400 font-medium text-sm">Detailed review of responses for this assessment.</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
               <div className="flex items-center gap-1.5 text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Correct
               </div>
               <div className="flex items-center gap-1.5 text-red-600">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> Incorrect
               </div>
            </div>
         </div>

         <div className="grid gap-6">
            {answers.map((ans, idx) => {
               const isCorrect = ans.selected_option === ans.questions.correct_answer
               return (
                  <div key={idx} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all">
                     <div className="flex items-start gap-6">
                        <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all",
                           isCorrect ? "bg-emerald-50 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-red-50 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        )}>
                           {idx + 1}
                        </div>
                        <div className="flex-1 space-y-6">
                           <h4 className="text-lg font-bold text-slate-900 leading-snug">{ans.questions.question_text}</h4>
                           
                           <div className="grid sm:grid-cols-2 gap-4">
                              {['a', 'b', 'c', 'd'].map((opt) => {
                                 const isSelected = ans.selected_option === opt
                                 const isCorrectOpt = ans.questions.correct_answer === opt
                                 return (
                                    <div key={opt} className={cn(
                                       "p-4 rounded-xl border text-sm font-bold flex items-center justify-between",
                                       isCorrectOpt ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                       isSelected ? "bg-red-50 border-red-200 text-red-700" :
                                       "bg-slate-50 border-slate-100 text-slate-400"
                                    )}>
                                       <div className="flex items-center gap-3">
                                          <span className="uppercase opacity-40">{opt}.</span>
                                          {ans.questions[`option_${opt}`]}
                                       </div>
                                       {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                       {isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-500" />}
                                    </div>
                                 )
                              })}
                           </div>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
      </div>
  
      {/* Footer CTA */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-100 overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-700" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
               <h3 className="text-2xl font-extrabold mb-2">Review Complete</h3>
               <p className="text-indigo-100/70 font-medium max-w-xl">
                  This performance record is officially logged. You can return to your dashboard or review results history at any time.
               </p>
            </div>
            <Link href="/dashboard" className="shrink-0">
               <button className="h-14 px-8 rounded-2xl bg-white text-indigo-600 font-extrabold text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2">
                  Return to Dashboard
                  <ChevronRight className="w-4 h-4" />
               </button>
            </Link>
         </div>
      </div>
    </div>
  )
}

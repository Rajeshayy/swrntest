"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/shared/auth-provider"
import { db } from "@/lib/firebase/client"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { TestInterface } from "@/components/test/test-interface"
import { AlertCircle, Clock, BookOpen, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function TestTakingPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    let unsubscribeAttempt: (() => void) | null = null

    const fetchData = async () => {
      try {
        const testId = params.id as string

        const testDoc = await getDoc(doc(db, "tests", testId))
        if (!testDoc.exists()) {
          router.push("/dashboard")
          return
        }
        const testData = { id: testDoc.id, ...testDoc.data() }
        setTest(testData)

        const now = new Date()
        const startTime = (testData as any).start_time?.toDate ? (testData as any).start_time.toDate() : new Date((testData as any).start_time)
        const endTime = new Date(startTime.getTime() + (testData as any).duration_minutes * 60000)

        if (now < startTime) {
          setErrorStatus(`notStarted|${startTime.toLocaleString()}`)
          setLoading(false)
          return
        }

        if (now > endTime) {
          setErrorStatus(`ended|${endTime.toLocaleString()}`)
          setLoading(false)
          return
        }

        const attemptsQ = query(
          collection(db, "testAttempts"),
          where("userId", "==", user.uid),
          where("testId", "==", testId)
        )
        const attemptSnapshot = await getDocs(attemptsQ)
        
        let currentAttemptId = ""
        if (!attemptSnapshot.empty) {
          const attemptData = attemptSnapshot.docs[0].data()
          if (attemptData.submittedAt) {
            router.push(`/results/${attemptSnapshot.docs[0].id}`)
            return
          }
          currentAttemptId = attemptSnapshot.docs[0].id
        } else {
          const newDoc = await addDoc(collection(db, "testAttempts"), {
            userId: user.uid,
            testId: testId,
            startedAt: serverTimestamp(),
            status: "inprogress",
            score: 0
          })
          currentAttemptId = newDoc.id
        }
        setAttemptId(currentAttemptId)

        // Setup real-time listener for the attempt
        const { onSnapshot } = await import("firebase/firestore")
        unsubscribeAttempt = onSnapshot(doc(db, "testAttempts", currentAttemptId), (doc) => {
          if (doc.exists()) {
            setAttempt({ id: doc.id, ...doc.data() })
          }
        })

        const questionsQ = query(
          collection(db, "tests", testId, "questions"),
          orderBy("createdAt", "asc")
        )
        const questionsSnapshot = await getDocs(questionsQ)
        const qData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        if (qData.length === 0) {
          setErrorStatus("noQuestions")
        } else {
          setQuestions(qData)
        }

      } catch (err) {
        console.error(err)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    return () => {
      if (unsubscribeAttempt) unsubscribeAttempt()
    }
  }, [user, authLoading, params.id, router])

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-subtle">
        <div className="flex flex-col items-center gap-6">
           <div className="w-16 h-16 border-4 border-white border-t-indigo-600 rounded-full animate-spin shadow-xl" />
           <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Entering Exam Portal...</p>
        </div>
      </div>
    )
  }

  if (errorStatus) {
    const [type, info] = errorStatus.split("|")
    return (
      <div className="flex h-screen items-center justify-center bg-subtle p-6 animate-scale-in">
         <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8">
               {type === "notStarted" ? <Clock className="w-10 h-10 text-indigo-400" /> : <AlertCircle className="w-10 h-10 text-red-400" />}
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
              {type === "notStarted" && "Registration is restricted until the scheduled start time."}
              {type === "ended" && "The examination period for this assessment has closed."}
              {type === "noQuestions" && "System data error: No questions available for this module."}
            </h2>
            
            {info && (
               <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 mb-8 inline-block mx-auto">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{type === "notStarted" ? "Opening At" : "Closed At"}</p>
                  <p className="text-sm font-extrabold text-slate-700">{info}</p>
               </div>
            )}
            
            <Link href="/dashboard" className="w-full">
               <button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Return to Portal
               </button>
            </Link>
         </div>
      </div>
    )
  }

  return (
    <div className="bg-subtle min-h-screen py-10 scroll-smooth">
      <TestInterface 
        test={{...test, start_time: (test as any).start_time?.toDate ? (test as any).start_time.toDate().toISOString() : test.start_time}} 
        questions={questions} 
        attemptId={attemptId!} 
        attempt={attempt}
      />
    </div>
  )
}

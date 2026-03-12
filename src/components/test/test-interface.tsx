"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { doc, updateDoc, setDoc, collection, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, Sparkles, CheckCircle, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

export function TestInterface({ test, questions, attemptId, attempt }: { test: any, questions: any[], attemptId: string, attempt: any }) {
  const router = useRouter()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({})

  const currentQuestion = questions[currentIdx]
  const isSuspended = attempt?.status === "suspended"

  // Initialize timer
  useEffect(() => {
    if (!test || isSuspended) return

    const startTime = new Date(test.start_time).getTime()
    const durationMs = test.duration_minutes * 60000
    const endTime = startTime + durationMs
    const now = new Date().getTime()
    
    const initialTimeLeft = Math.max(0, Math.floor((endTime - now) / 1000))
    setTimeLeft(initialTimeLeft)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [test, isSuspended])

  // Monitor Window Visibility (Tab Switching)
  useEffect(() => {
    if (isSuspended || isSubmitting) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          await updateDoc(doc(db, "testAttempts", attemptId), {
            status: "suspended",
            suspendedAt: serverTimestamp(),
            suspensionReason: "Tab Switch / Loss of Focus"
          })
          toast.error("Test Suspended! Focus lost or tab switched.")
        } catch (err) {
          console.error("Failed to suspend test", err)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [attemptId, isSuspended, isSubmitting])

  // Prevent page refresh/leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const handleOptionChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value
    }))
  }

  const toggleFlag = (idx: number) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const batch = Object.entries(answers).map(([qId, option]) => 
        setDoc(doc(db, "testAttempts", attemptId, "answers", qId), {
          selectedOption: option
        })
      )
      await Promise.all(batch)

      let score = 0
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) {
          score++
        }
      })

      await updateDoc(doc(db, "testAttempts", attemptId), {
        submittedAt: serverTimestamp(),
        status: "completed",
        score: score
      })

      toast.success("Examination submitted successfully!")
      router.push(`/results/${attemptId}`)
    } catch (error: any) {
      toast.error("Failed to submit test: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, attemptId, questions, isSubmitting, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((Object.keys(answers).length) / questions.length) * 100

  if (!currentQuestion) return (
     <div className="flex flex-col items-center justify-center p-20 text-center animate-slide-up">
        <AlertCircle className="w-16 h-16 text-slate-200 mb-6" />
        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Examination Setup Incomplete</h3>
        <p className="text-slate-400 font-medium">No questions found for this assessment.</p>
     </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 animate-slide-up relative">
      {/* Suspension Overlay */}
      {isSuspended && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
           <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl animate-scale-in border border-slate-100">
              <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 ring-8 ring-red-50/50">
                 <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Assessment Suspended</h2>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                 A focus violation has been detected (Tab Switching/Focus Loss). Your examination has been paused and locked for security.
              </p>
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100/50 mb-8">
                 <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Action Required</p>
                 <p className="text-sm font-bold text-amber-700">Please contact your proctor or administrator to resume your session.</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl border-slate-200 font-bold hover:bg-slate-50 transition-all shadow-sm"
                onClick={() => router.push("/dashboard")}
              >
                Return to Dashboard
              </Button>
           </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg rounded-[2.5rem] p-6 mb-8 sticky top-4 z-50 flex items-center justify-between ring-8 ring-indigo-50/20">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 bg-indigo-50 px-5 py-2.5 rounded-2xl border border-indigo-100/50 group">
              <Clock className={cn("h-5 w-5", timeLeft < 300 ? "text-red-500 animate-pulse" : "text-indigo-600")} />
              <span className={cn("font-bold font-mono text-xl tabular-nums tracking-tight", timeLeft < 300 ? "text-red-600" : "text-slate-900")}>
                {formatTime(timeLeft)}
              </span>
           </div>
           
           <div className="hidden md:block">
              <h2 className="text-lg font-extrabold text-slate-900 leading-none mb-1">{test.title}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                 ID-{(test.id || "000").slice(-6).toUpperCase()}
              </p>
           </div>
        </div>

        <div className="flex-1 max-w-xs mx-12 hidden lg:block">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Progress</span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{Math.round(progress)}% Complete</span>
           </div>
           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div 
                 className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                 style={{ width: `${progress}%` }}
              />
           </div>
        </div>

        <div className="flex items-center gap-3">
           <Button 
              variant="outline" 
              className="h-11 px-5 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              onClick={() => toggleFlag(currentIdx)}
           >
              <Flag className={cn("h-4 w-4", flaggedQuestions[currentIdx] ? "fill-amber-400 text-amber-400" : "text-slate-400")} />
              {flaggedQuestions[currentIdx] ? "Flagged" : "Flag"}
           </Button>
           
           <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="h-11 px-6 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
           >
              <Send className="w-4 h-4" />
              Submit
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Question Area */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-white rounded-[2.5rem] premium-shadow border border-slate-100 p-10 relative overflow-hidden group">
              {/* Question background decorative element */}
              <div className="absolute top-0 right-0 p-20 bg-indigo-50/30 rounded-full blur-3xl -z-10" />
              
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-indigo-50">
                    {currentIdx + 1}
                 </div>
                 <div className="h-px flex-1 bg-slate-100" />
                 <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-10 tracking-tight">
                 {currentQuestion.question_text}
              </h1>

              <RadioGroup 
                value={answers[currentQuestion.id] || ""} 
                onValueChange={handleOptionChange}
                className="space-y-4"
              >
                {['a', 'b', 'c', 'd'].map((option) => (
                  <div 
                    key={option} 
                    className={cn(
                      "flex items-center group/opt relative p-6 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden",
                      answers[currentQuestion.id] === option 
                        ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/5 shadow-md" 
                        : "border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-300"
                    )} 
                    onClick={() => handleOptionChange(option)}
                  >
                    {/* Animated background on select */}
                    {answers[currentQuestion.id] === option && (
                       <div className="absolute inset-0 bg-white/50 backdrop-blur-sm -z-0 opacity-0 group-active:opacity-100" />
                    )}

                    <RadioGroupItem value={option} id={`option-${option}`} className="hidden" />
                    
                    <div className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border-2 mr-6 transition-all",
                       answers[currentQuestion.id] === option 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" 
                          : "bg-white border-slate-200 text-slate-400 group-hover/opt:border-indigo-400 group-hover/opt:text-indigo-600"
                    )}>
                       {option.toUpperCase()}
                    </div>

                    <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer text-base font-bold text-slate-700 leading-tight group-hover/opt:text-slate-900">
                      {currentQuestion[`option_${option}`]}
                    </Label>

                    {answers[currentQuestion.id] === option && (
                       <CheckCircle className="w-5 h-5 text-indigo-600 ml-4 animate-scale-in" />
                    )}
                  </div>
                ))}
              </RadioGroup>
           </div>

           {/* Mobile-friendly navigation buttons */}
           <div className="flex items-center justify-between pt-4">
              <Button 
                variant="outline" 
                className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 group flex items-center gap-3 transition-all enabled:active:scale-95"
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
              >
                <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Previous Question
              </Button>

              <div className="flex-1 mx-8 h-1 bg-slate-100 rounded-full relative overflow-hidden max-w-[120px] hidden sm:block">
                 <div 
                    className="absolute inset-y-0 bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ left: `${(currentIdx / (questions.length - 1)) * 100}%`, width: '10px' }}
                 />
              </div>

              {currentIdx === questions.length - 1 ? (
                 <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting} 
                    className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 animate-pulse-glow"
                 >
                    Finish Examination
                 </Button>
              ) : (
                <Button 
                  className="h-14 px-10 rounded-2xl gradient-primary text-white font-bold group flex items-center gap-3 transition-all enabled:active:scale-95 shadow-lg shadow-indigo-100"
                  onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                >
                   Next Question
                   <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
           </div>
        </div>

        {/* Question Grid Sidebar */}
        <div className="lg:col-span-4 sticky top-32 space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                 <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Navigation</h4>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active</span>
                 </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                 {questions.map((_, idx) => {
                    const isCurrent = currentIdx === idx
                    const isAnswered = !!answers[questions[idx].id]
                    const isFlagged = flaggedQuestions[idx]
                    
                    return (
                       <button 
                        key={idx}
                        className={cn(
                           "relative w-full aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 hover:scale-110",
                           isCurrent 
                              ? "bg-slate-900 text-white shadow-lg ring-4 ring-slate-100" 
                              : isAnswered 
                                 ? "bg-indigo-600 text-white shadow-sm"
                                 : "bg-slate-50 text-slate-400 border border-slate-200 hover:border-indigo-400"
                        )}
                        onClick={() => setCurrentIdx(idx)}
                       >
                        {idx + 1}
                        {isFlagged && (
                           <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full" />
                        )}
                       </button>
                    )
                 })}
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50 space-y-3">
                 <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Summary</span>
                    <Sparkles className="w-3.5 h-3.5" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 mb-0.5">Answered</p>
                       <p className="text-lg font-extrabold text-slate-900">{Object.keys(answers).length}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 mb-0.5">Flagged</p>
                       <p className="text-lg font-extrabold text-slate-900">{Object.values(flaggedQuestions).filter(Boolean).length}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                    <AlertCircle className="w-6 h-6 text-white" />
                 </div>
                 <h4 className="text-xl font-extrabold mb-2">Technical Issues?</h4>
                 <p className="text-indigo-100/70 text-sm font-medium leading-relaxed">If you experience any connectivity problems, your answers are autosaved. Contact proctor immediately.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

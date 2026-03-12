"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/client"
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc, doc, updateDoc, increment } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, HelpCircle, CheckCircle2, Layout, Sparkles, AlertCircle, FileUp, Database, Edit2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { questionSchema } from "@/lib/validations/test"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

export function QuestionManagement({ testId }: { testId: string }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "a",
    },
  })

  useEffect(() => {
    fetchQuestions()
  }, [testId])

  async function fetchQuestions() {
    if (!testId || typeof testId !== 'string') return
    
    setLoading(true)
    try {
      const q = query(
        collection(db, "tests", testId, "questions"), 
        orderBy("createdAt", "asc")
      )
      const querySnapshot = await getDocs(q)
      const fetchedQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setQuestions(fetchedQuestions)
    } catch (error: any) {
      console.error("Fetch error:", error)
      toast.error("Failed to fetch assessment items.")
    }
    setLoading(false)
  }

  const onSubmit: SubmitHandler<z.infer<typeof questionSchema>> = async (values) => {
    if (!testId || typeof testId !== "string" || testId.trim() === "") {
      toast.error("Resource Reference Error: Examination ID is missing.")
      return
    }
    
    try {
      await addDoc(collection(db, "tests", testId, "questions"), {
        ...values,
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, "tests", testId), {
        total_questions: increment(1)
      })

      toast.success("Question localized successfully")
      setIsAddOpen(false)
      form.reset()
      fetchQuestions()
    } catch (error: any) {
      console.error("Firestore Add Error:", error)
      toast.error(error.message || "Failed to register question logic.")
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Are you sure you want to delete this question?")) return

    try {
      await deleteDoc(doc(db, "tests", testId, "questions", id))
      await updateDoc(doc(db, "tests", testId), {
        total_questions: increment(-1)
      })
      toast.success("Question removed from assessment")
      fetchQuestions()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // Robust CSV parsing for quoted fields
      const parseCSVLine = (line: string) => {
        const result = []
        let cur = ''
        let inQuote = false
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"' && line[i+1] === '"') {
            cur += '"'; i++
          } else if (char === '"') {
            inQuote = !inQuote
          } else if (char === ',' && !inQuote) {
            result.push(cur.trim())
            cur = ''
          } else {
            cur += char
          }
        }
        result.push(cur.trim())
        return result
      }

      const bulkQuestions = lines.slice(1).map(line => {
        const [txt, a, b, c, d, correct] = parseCSVLine(line)
        return {
          question_text: txt,
          option_a: a,
          option_b: b,
          option_c: c,
          option_d: d,
          correct_answer: (correct || 'a').toLowerCase()
        }
      }).filter(q => q.question_text && q.option_a)

      if (bulkQuestions.length === 0) {
        toast.error("No valid question data found. Format: Question, Option A, Option B, Option C, Option D, Correct (a/b/c/d)")
        return
      }

      try {
        setLoading(true)
        // Create all questions concurrently
        await Promise.all(bulkQuestions.map(qData => 
          addDoc(collection(db, "tests", testId, "questions"), {
            ...qData,
            createdAt: serverTimestamp(),
          })
        ))

        // Update the total question count in one operation
        await updateDoc(doc(db, "tests", testId), {
          total_questions: increment(bulkQuestions.length)
        })
        
        toast.success(`Successfully uploaded ${bulkQuestions.length} questions`)
        fetchQuestions()
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-3 pl-2">
           <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Logic Pool</p>
              <p className="text-sm font-bold text-slate-900 leading-none">{questions.length} Active Questions</p>
           </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
             <input 
               type="file" 
               accept=".csv" 
               className="hidden" 
               id="bulk-question-upload" 
               onChange={handleBulkUpload}
             />
             <label 
               htmlFor="bulk-question-upload" 
               className="flex items-center h-11 px-5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-all shadow-sm"
             >
               <FileUp className="mr-2 h-4 w-4 text-indigo-500" />
               Bulk CSV
             </label>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger 
              render={
                <Button className="h-11 px-6 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-indigo-100 button-hover text-xs">
                  <Plus className="mr-2 h-5 w-5" /> New Question
                </Button>
              }
            />
            <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-2xl">
              <div className="gradient-primary p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-3xl -z-0" />
                 <DialogHeader className="relative z-10">
                   <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
                      <Layout className="w-6 h-6" />
                      New Assessment Item
                   </DialogTitle>
                   <DialogDescription className="text-indigo-100 font-medium">
                      Configure question parameters and logical outcomes.
                   </DialogDescription>
                 </DialogHeader>
              </div>
              
              <div className="p-8 pb-10">
                 <Form {...form}>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                       control={form.control}
                       name="question_text"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel className="text-slate-700 font-bold px-1">Question Content</FormLabel>
                           <FormControl>
                             <Input placeholder="Enter the examination question text..." className="h-14 rounded-xl focus:ring-4 focus:ring-indigo-50 border-slate-200" {...field} />
                           </FormControl>
                           <FormMessage className="font-medium" />
                         </FormItem>
                       )}
                     />
                     
                     <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                       {['a', 'b', 'c', 'd'].map((opt) => (
                         <FormField
                           key={opt}
                           control={form.control}
                           name={`option_${opt}` as any}
                           render={({ field }) => (
                             <FormItem>
                               <div className="flex items-center justify-between px-1">
                                  <FormLabel className="text-slate-700 font-bold uppercase text-[10px] tracking-widest">Option {opt}</FormLabel>
                                  {form.watch('correct_answer') === opt && (
                                     <div className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase">Correct</span>
                                     </div>
                                  )}
                               </div>
                               <FormControl>
                                 <div className="relative group">
                                    <div className={cn(
                                       "absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-black transition-all",
                                       form.watch('correct_answer') === opt ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-400 group-focus-within:border-indigo-400"
                                    )}>
                                       {opt.toUpperCase()}
                                    </div>
                                    <Input placeholder={`Response for ${opt}...`} className="h-12 pl-12 rounded-xl focus:ring-4 focus:ring-indigo-50 border-slate-100 bg-slate-50/50" {...field} />
                                 </div>
                               </FormControl>
                               <FormMessage className="font-medium" />
                             </FormItem>
                           )}
                         />
                       ))}
                     </div>

                     <FormField
                       control={form.control}
                       name="correct_answer"
                       render={({ field }) => (
                         <FormItem className="space-y-4 pt-4 border-t border-slate-50">
                           <div className="flex items-center justify-between">
                              <FormLabel className="text-slate-700 font-bold">Select Correct Answer</FormLabel>
                              <Sparkles className="w-4 h-4 text-amber-400" />
                           </div>
                           <FormControl>
                             <RadioGroup
                               onValueChange={field.onChange}
                               defaultValue={field.value}
                               className="flex items-center gap-4"
                             >
                               {['a', 'b', 'c', 'd'].map((opt) => (
                                 <FormItem key={opt} className="flex-1 flex items-center space-x-0 space-y-0">
                                   <FormControl>
                                     <RadioGroupItem value={opt} className="hidden" />
                                   </FormControl>
                                   <FormLabel 
                                      className={cn(
                                         "flex-1 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xs cursor-pointer transition-all",
                                         field.value === opt 
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-100 scale-105" 
                                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200"
                                      )}
                                   >
                                     {opt.toUpperCase()}
                                   </FormLabel>
                                 </FormItem>
                               ))}
                             </RadioGroup>
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     
                     <DialogFooter className="pt-6">
                       <Button type="submit" className="w-full h-14 rounded-[1.2rem] gradient-primary text-white font-extrabold text-sm uppercase tracking-widest button-hover shadow-xl shadow-indigo-100">
                          Register Question Logic
                       </Button>
                     </DialogFooter>
                   </form>
                 </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
           Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-48 bg-slate-50 rounded-[2.5rem] animate-pulse border border-slate-100" />
           ))
        ) : questions.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-xl font-extrabold text-slate-900 mb-2">Examination Remains Empty</h3>
             <p className="text-slate-400 font-medium">No valid items have been localized for this assessment yet.</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div 
               key={q.id} 
               className="group bg-white rounded-[2.5rem] p-10 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-500 animate-slide-up relative overflow-hidden"
               style={{ animationDelay: `${index * 80}ms` }}
            >
               <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600 opacity-20 group-hover:opacity-100 transition-opacity" />

               <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                  <div className="flex-1 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                           {index + 1}
                        </div>
                        <h4 className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight">{q.question_text}</h4>
                     </div>

                     <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                        {['a', 'b', 'c', 'd'].map((opt) => {
                           const isCorrect = q.correct_answer === opt
                           return (
                              <div 
                                 key={opt} 
                                 className={cn(
                                    "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                                    isCorrect 
                                       ? "bg-emerald-50/60 border-emerald-500 shadow-sm group-hover:scale-[1.02]" 
                                       : "bg-slate-50/50 border-slate-100 text-slate-500"
                                 )}
                              >
                                 <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border-2",
                                    isCorrect ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100" : "bg-white border-slate-200 text-slate-400"
                                 )}>
                                    {opt.toUpperCase()}
                                 </div>
                                 <span className={cn(
                                    "text-sm font-bold tracking-tight",
                                    isCorrect ? "text-slate-900" : "text-slate-500"
                                 )}>
                                    {q[`option_${opt}`]}
                                 </span>
                                 {isCorrect && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto animate-pulse" />
                                 )}
                              </div>
                           )
                        })}
                     </div>
                  </div>

                  <div className="flex md:flex-col gap-2 p-1">
                     <button className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/50 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <Edit2 className="h-4 w-4" />
                     </button>
                     <button 
                        className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        onClick={() => deleteQuestion(q.id)}
                     >
                        <Trash2 className="h-4 w-4" />
                     </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

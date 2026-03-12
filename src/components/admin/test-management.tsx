"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase/client"
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit2, Trash2, HelpCircle, Clock, Calendar, FileText, Sparkles, AlertCircle, TrendingUp } from "lucide-react"
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
import { testSchema } from "@/lib/validations/test"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function TestManagement() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)

  type TestFormValues = z.infer<typeof testSchema>

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      description: "",
      start_time: "",
      duration_minutes: 60,
    },
  })

  useEffect(() => {
    fetchTests()
  }, [])

  async function fetchTests() {
    setLoading(true)
    try {
      const q = query(collection(db, "tests"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const fetchedTests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start_time: doc.data().start_time?.toDate ? doc.data().start_time.toDate().toISOString() : doc.data().start_time
      }))
      setTests(fetchedTests)
    } catch (error) {
      toast.error("Failed to fetch tests")
    }
    setLoading(false)
  }

  const onSubmit: SubmitHandler<TestFormValues> = async (values) => {
    try {
      const user = auth.currentUser
      
      await addDoc(collection(db, "tests"), {
        ...values,
        start_time: new Date(values.start_time),
        created_by: user?.uid,
        total_questions: 0,
        createdAt: serverTimestamp(),
      })

      toast.success("Test created successfully")
      setIsAddOpen(false)
      form.reset()
      fetchTests()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  async function deleteTest(id: string) {
    if (!confirm("Are you sure you want to delete this test?")) return

    try {
      await deleteDoc(doc(db, "tests", id))
      toast.success("Test deleted successfully")
      fetchTests()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Search and Create Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder="Search examinations by title..." 
            className="h-11 pl-10 pr-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 rounded-2xl transition-all font-medium text-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger 
            render={
              <Button className="w-full sm:w-auto h-11 px-6 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-indigo-100 button-hover">
                <Plus className="mr-2 h-5 w-5" /> Create Test
              </Button>
            }
          />
          <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
            <div className="gradient-primary p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full blur-3xl" />
               <DialogHeader className="relative z-10">
                 <DialogTitle className="text-2xl font-extrabold flex items-center gap-2.5">
                    <FileText className="w-6 h-6" />
                    New Examination
                 </DialogTitle>
                 <DialogDescription className="text-indigo-100 font-medium font-medium px-4">
                    Schedule a new assessment for students.
                 </DialogDescription>
               </DialogHeader>
            </div>
            
            <div className="p-8 pb-10">
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                   <FormField
                     control={form.control}
                     name="title"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="text-slate-700 font-bold px-1">Test Title</FormLabel>
                         <FormControl>
                           <Input placeholder="Engineering Physics - Final" className="h-12 rounded-xl focus:ring-4 focus:ring-indigo-50" {...field} />
                         </FormControl>
                         <FormMessage className="font-medium" />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="description"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="text-slate-700 font-bold px-1 text-slate-700">Description (Optional)</FormLabel>
                         <FormControl>
                           <Input placeholder="Short summary of topics..." className="h-12 rounded-xl focus:ring-4 focus:ring-indigo-50" {...field} />
                         </FormControl>
                         <FormMessage className="font-medium" />
                       </FormItem>
                     )}
                   />
                   <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold px-1">Start Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" className="h-12 rounded-xl focus:ring-4 focus:ring-indigo-50" {...field} />
                            </FormControl>
                            <FormMessage className="font-medium" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="duration_minutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold px-1">Duration (Min)</FormLabel>
                            <FormControl>
                              <Input type="number" className="h-12 rounded-xl focus:ring-4 focus:ring-indigo-50" {...field} />
                            </FormControl>
                            <FormMessage className="font-medium" />
                          </FormItem>
                        )}
                      />
                   </div>
                   <DialogFooter className="pt-6">
                     <Button type="submit" className="w-full h-12 rounded-2xl gradient-primary text-white font-bold button-hover shadow-lg shadow-indigo-100">
                        Launch Assessment
                     </Button>
                   </DialogFooter>
                 </form>
               </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tests Grid Layout (Modern Alternative to Table) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
         {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="h-64 bg-slate-100/50 rounded-[2rem] animate-pulse border border-slate-200/60" />
            ))
         ) : filteredTests.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-200/60 shadow-sm">
               <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-300">
                  <AlertCircle className="w-6 h-6 text-slate-300" />
               </div>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Scheduled Tests Found</p>
            </div>
         ) : (
            filteredTests.map((test, index) => (
               <div 
                  key={test.id} 
                  className="bg-white rounded-[2rem] p-7 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up group flex flex-col h-full"
                  style={{ animationDelay: `${index * 80}ms` }}
               >
                  <div className="flex items-center justify-between mb-6">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <FileText className="h-5.5 w-5.5" />
                     </div>
                     <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-100/50">Scheduled</span>
                  </div>
                  
                  <div className="flex-1">
                     <h3 className="text-[18px] font-extrabold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{test.title}</h3>
                     <p className="text-slate-400 text-sm font-medium line-clamp-2 mb-6 h-10">{test.description || "No description provided for this assessment."}</p>
                     
                     <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-tight">
                           <Calendar className="w-4 h-4 text-slate-300" />
                           {new Date(test.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-tight">
                           <Clock className="w-4 h-4 text-slate-300" />
                           {new Date(test.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({test.duration_minutes}m)
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-tight">
                           <HelpCircle className="w-4 h-4 text-indigo-400/70" />
                           {test.total_questions || 0} Questions Total
                        </div>
                     </div>
                  </div>
                                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/tests/${test.id}/questions`} className="flex-1">
                           <button className="w-full h-11 rounded-xl bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-sm">
                              Manage Questions
                           </button>
                        </Link>
                        <Link href={`/admin/tests/${test.id}/results`} className="flex-1">
                           <button className="w-full h-11 rounded-xl bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Results
                           </button>
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200/50 flex items-center justify-center gap-2">
                           <Edit2 className="h-4 w-4" /> Edit
                        </button>
                        <button 
                           className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all border border-red-100/50"
                           onClick={() => deleteTest(test.id)}
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

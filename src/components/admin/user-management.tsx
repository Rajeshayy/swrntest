"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/client"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, UserCheck, Edit2, Trash2, Mail, Shield, Sparkles, AlertCircle, Upload, FileUp } from "lucide-react"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  registrationNumber: z.string().min(4, "Registration Number must be at least 4 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      registrationNumber: "",
      password: "",
    },
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const q = query(
        collection(db, "profiles"), 
        where("role", "==", "student")
      )
      const querySnapshot = await getDocs(q)
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
      setUsers(fetchedUsers)
    } catch (error) {
      toast.error("Failed to fetch students")
    }
    setLoading(false)
  }

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, role: 'student' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create student")
      }

      toast.success("Student added successfully")
      setIsAddOpen(false)
      form.reset()
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Are you sure you want to delete this student?")) return

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error("Failed to delete student")
      }

      toast.success("Student deleted successfully")
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // Header: name, registrationNumber, password (optional)
      const users = lines.slice(1).map(line => {
        const [name, registrationNumber, password] = line.split(',').map(s => s.trim())
        // Default password to registrationNumber if not provided
        const finalPassword = password || registrationNumber
        return { name, registrationNumber, password: finalPassword, role: 'student' }
      }).filter(u => u.registrationNumber && u.password)

      if (users.length === 0) {
        toast.error("No valid user data found. Expected: name, registrationNumber, [password]")
        return
      }

      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users),
        })
        const data = await response.json()
        if (data.results) {
          const successCount = data.results.filter((r: any) => r.success).length
          toast.success(`Successfully uploaded ${successCount}/${users.length} users`)
          fetchUsers()
        }
      } catch (err: any) {
        toast.error(err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Search and Action Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -z-0 group-hover:scale-150 transition-transform duration-700" />
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search students by name or Reg No..." 
            className="h-11 pl-10 pr-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-2xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto relative z-10">
          <div className="relative">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              id="bulk-user-upload" 
              onChange={handleBulkUpload}
            />
            <label 
              htmlFor="bulk-user-upload" 
              className="flex items-center h-11 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm cursor-pointer hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap"
            >
              <FileUp className="mr-2 h-4 w-4 text-indigo-500" />
              Bulk CSV
            </label>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger 
              render={
                <Button className="flex-1 lg:flex-none h-11 px-6 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-indigo-100 button-hover whitespace-nowrap">
                  <Plus className="mr-2 h-5 w-5" /> Enroll Student
                </Button>
              }
            />
            <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
              <div className="gradient-primary p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full blur-3xl" />
                 <DialogHeader className="relative z-10">
                   <DialogTitle className="text-2xl font-extrabold flex items-center gap-2.5">
                      <UserCheck className="w-6 h-6" />
                      New Student
                   </DialogTitle>
                   <DialogDescription className="text-indigo-100 font-medium px-4">
                      Register a new student account below.
                   </DialogDescription>
                 </DialogHeader>
              </div>
              
              <div className="p-8 pb-10">
                 <Form {...form}>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                     <FormField
                       control={form.control}
                       name="name"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel className="text-slate-700 font-bold px-1">Full Name</FormLabel>
                           <FormControl>
                             <Input placeholder="John Doe" className="h-12 rounded-xl focus:ring-4 focus:ring-indigo-50" {...field} />
                           </FormControl>
                           <FormMessage className="font-medium" />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={form.control}
                       name="registrationNumber"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel className="text-slate-700 font-bold px-1">Registration Number</FormLabel>
                           <FormControl>
                             <Input placeholder="e.g. 2024-ABC-123" className="h-12 rounded-xl focus:ring-4 focus:ring-indigo-50" {...field} />
                           </FormControl>
                           <FormMessage className="font-medium" />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={form.control}
                       name="password"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel className="text-slate-700 font-bold px-1">Password</FormLabel>
                           <FormControl>
                             <Input type="password" placeholder="••••••••" className="h-12 rounded-xl focus:ring-4 focus:ring-indigo-50" {...field} />
                           </FormControl>
                           <FormMessage className="font-medium" />
                         </FormItem>
                       )}
                     />
                     <DialogFooter className="pt-4">
                       <Button type="submit" className="w-full h-12 rounded-2xl gradient-primary text-white font-bold button-hover shadow-lg shadow-indigo-100">
                          Create Account
                       </Button>
                     </DialogFooter>
                   </form>
                 </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
         <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <Shield className="w-4 h-4 text-indigo-500" />
               Current Students
            </h3>
            <span className="text-[10px] bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 font-bold shadow-sm">
               {filteredUsers.length} Students Total
            </span>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-slate-100">
                     <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Candidate</th>
                     <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Identity</th>
                     <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest hidden md:table-cell">Joined Date</th>
                     <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                     <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                           <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                           <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Records...</p>
                        </td>
                     </tr>
                  ) : filteredUsers.length === 0 ? (
                     <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-300">
                              <Search className="w-6 h-6 text-slate-300" />
                           </div>
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Students Found</p>
                        </td>
                     </tr>
                  ) : (
                     filteredUsers.map((user, index) => (
                        <tr key={user.id} className="group hover:bg-slate-50/50 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="w-11 h-11 rounded-[1.1rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                    {user.name?.[0]?.toUpperCase()}
                                 </div>
                                 <div className="overflow-hidden">
                                    <p className="font-extrabold text-slate-900 leading-none mb-1 truncate">{user.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">System ID: {(user.id).slice(-8).toUpperCase()}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <div className="flex flex-col items-center gap-1">
                                 <div className="flex items-center gap-2 text-sm text-indigo-600 font-extrabold tracking-tight bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100 shadow-sm">
                                    <Shield className="w-3.5 h-3.5" />
                                    {user.registrationNumber || "N/A"}
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5 hidden md:table-cell">
                              <p className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60 inline-block shadow-sm">
                                 {user.createdAt ? (user.createdAt.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()) : "Recently"}
                              </p>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2 px-2">
                                 <button className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm border border-slate-200/50">
                                    <Edit2 className="h-4 w-4" />
                                 </button>
                                 <button 
                                    className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm border border-red-100/50" 
                                    onClick={() => deleteUser(user.id)}
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}

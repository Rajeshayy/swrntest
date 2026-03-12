"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { auth, db } from "@/lib/firebase/client"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { loginSchema } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { BookOpen, Sparkles, LogIn } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema as any),
    defaultValues: {
      registrationNumber: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true)
    try {
      // Determine if the input is an email (Admin) or registration number (Student)
      const identifier = values.registrationNumber.includes('@') 
        ? values.registrationNumber.toLowerCase()
        : `${values.registrationNumber}@reg.online.test`.toLowerCase()

      const userCredential = await signInWithEmailAndPassword(
        auth,
        identifier,
        values.password
      )
      const user = userCredential.user
      toast.success("Logged in successfully!")
      
      const docRef = doc(db, "profiles", user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials. Please check your Registration Number.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-subtle p-6">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 p-32 bg-indigo-50/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 p-32 bg-purple-50/50 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-[28rem] animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-6 ring-4 ring-indigo-50">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-slate-500 font-medium">
            Sign in to your student portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl premium-shadow p-10 border border-slate-100">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold px-1">Registration Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 2024-ABC-123" 
                        className="h-12 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <div className="flex items-center justify-between px-1">
                      <FormLabel className="text-slate-700 font-semibold">Password</FormLabel>
                      <button type="button" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        Forgot?
                      </button>
                    </div>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="h-12 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="font-medium" />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl gradient-primary text-white font-bold text-lg shadow-lg shadow-indigo-100 button-hover mt-4"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 font-medium">
              Don't have an account?{" "}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { auth, db } from "@/lib/firebase/client"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { registerSchema } from "@/lib/validations/auth"
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
import { BookOpen, UserPlus, Sparkles } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema as any),
    defaultValues: {
      name: "",
      registrationNumber: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setLoading(true)
    try {
      // Firebase Auth requires an email, so we derive one from registrationNumber
      const internalEmail = `${values.registrationNumber}@reg.online.test`.toLowerCase()
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        internalEmail,
        values.password
      )
      const user = userCredential.user
      await updateProfile(user, { displayName: values.name })
      await setDoc(doc(db, "profiles", user.uid), {
        name: values.name,
        registrationNumber: values.registrationNumber,
        email: internalEmail, // internal storage
        role: "student",
        createdAt: serverTimestamp(),
      })
      toast.success("Registration successful! You can now log in.")
      router.push("/login")
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-subtle p-6">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 p-32 bg-indigo-50/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 p-32 bg-purple-50/50 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-[28rem] animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-6 ring-4 ring-indigo-50">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Create account
          </h1>
          <p className="text-slate-500 font-medium font-medium px-4">
            Join thousands of students on our portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl premium-shadow p-8 border border-slate-100">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold px-1">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
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
                    <FormLabel className="text-slate-700 font-semibold px-1">Password</FormLabel>
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
                    <UserPlus className="w-5 h-5 text-indigo-100" />
                    Sign Up
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

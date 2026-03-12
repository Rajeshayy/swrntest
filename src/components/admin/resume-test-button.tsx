"use client"

import { useState } from "react"
import { db } from "@/lib/firebase/client"
import { doc, updateDoc } from "firebase/firestore"
import { Play, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ResumeTestButton({ attemptId, status }: { attemptId: string, status: string }) {
  const [loading, setLoading] = useState(false)

  const handleResume = async () => {
    if (loading) return
    setLoading(true)
    try {
      await updateDoc(doc(db, "testAttempts", attemptId), {
        status: "inprogress",
        resumedAt: new Date(),
        // Keep a record of suspension in case we want to see history
        suspensionFixed: true
      })
      toast.success("Examination resumed successfully!")
    } catch (err: any) {
      toast.error("Failed to resume test: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status !== "suspended") return null

  return (
    <button
      onClick={handleResume}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100 active:scale-95 disabled:opacity-50",
        loading && "cursor-not-allowed"
      )}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Play className="w-3 h-3 fill-current" />
      )}
      Resume Test
    </button>
  )
}

import { QuestionManagement } from "@/components/admin/question-management"
import { adminDb } from "@/lib/firebase/admin"
import { Sparkles, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function AdminQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const testDoc = await adminDb.collection('tests').doc(id).get()
  const testData = testDoc.data()

  return (
    <div className="space-y-10 animate-slide-up p-4">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-4">
          <Link href="/admin/tests">
             <button className="flex items-center gap-2 group px-4 py-2 hover:bg-slate-100 rounded-2xl transition-all">
                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
                <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Back to Tests</span>
             </button>
          </Link>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest leading-none">Administration</div>
               <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
               Questions: <span className="text-indigo-600">{testData?.title || "Loading..."}</span>
            </h2>
            <p className="text-slate-500 font-medium mt-1">Design and manage assessment logic for this examination.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm">
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Points</p>
              <p className="text-lg font-black text-slate-900 leading-none">{testData?.total_questions || 0}</p>
           </div>
        </div>
      </div>

      <QuestionManagement testId={id} />
    </div>
  )
}

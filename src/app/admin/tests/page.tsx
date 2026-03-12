import { TestManagement } from "@/components/admin/test-management"
import { Sparkles, FileText } from "lucide-react"

export default function AdminTestsPage() {
  return (
    <div className="space-y-10 animate-slide-up p-4">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest leading-none">Administration</div>
             <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Test Management</h2>
          <p className="text-slate-500 font-medium mt-1">Design and launch secure examination modules.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm relative group overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
           <div className="relative z-10 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Global Catalog</p>
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                 <FileText className="w-4 h-4 text-indigo-500" />
                 Active Assessments
              </div>
           </div>
        </div>
      </div>

      <TestManagement />
    </div>
  )
}

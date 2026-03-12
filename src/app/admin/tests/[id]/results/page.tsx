import { adminDb } from "@/lib/firebase/admin"
import { FileText, Sparkles, User, Trophy, Clock, ArrowLeft, Target, PlayCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import { ResumeTestButton } from "@/components/admin/resume-test-button"

export default async function TestSpecificResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = await params

  // Fetch test details
  const testDoc = await adminDb.collection('tests').doc(testId).get()
  if (!testDoc.exists) {
    return notFound()
  }
  const testData = testDoc.data()

  // Fetch attempts for this specific test
  const attemptsSnapshot = await adminDb
    .collection('testAttempts')
    .where('testId', '==', testId)
    .get()

  const rawResults = (await Promise.all(attemptsSnapshot.docs.map(async (doc) => {
    const data = doc.data() as any
    
    // Skip if userId is invalid to prevent "documentPath" error
    if (!data.userId || typeof data.userId !== 'string') {
      return null
    }

    const studentDoc = await adminDb.collection('profiles').doc(data.userId).get()
    
    return {
      id: doc.id,
      score: data.score || 0,
      status: data.status || (data.submittedAt ? "completed" : "inprogress"),
      total_questions: testData?.total_questions || 0,
      submitted_at: data.submittedAt?.toDate?.()?.toISOString() || null,
      suspendedAt: data.suspendedAt?.toDate?.()?.toISOString() || null,
      student: studentDoc.data(),
    }
  }))).filter(Boolean) as any[]

  // Categorize results
  const finalResults = rawResults
    .filter(r => r.status === 'completed')
    .sort((a, b) => b.score - a.score)
    
  const liveResults = rawResults
    .filter(r => r.status !== 'completed')

  return (
    <div className="space-y-12 animate-slide-up p-4 pb-20">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <Link href="/admin/tests" className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Examinations
          </Link>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest leading-none">Assessment Analytics</div>
             <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{testData?.title}</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time tracking and final performance evaluation.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                 <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Top Score</p>
                 <p className="text-xl font-black text-slate-900 leading-none">
                    {finalResults.length > 0 ? finalResults[0].score : 0}/{testData?.total_questions || 0}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Summary Area */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Total Candidates", value: rawResults.length, icon: User, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Final Results", value: finalResults.length, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Live Active", value: liveResults.filter(r => r.status === 'inprogress').length, icon: PlayCircle, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Suspended", value: liveResults.filter(r => r.status === 'suspended').length, icon: AlertCircleIcon, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* 1. Final Results Table (Highest to Lowest) */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
               <Target className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Final Performance Results</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ranked by Score (Highest to Lowest)</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-slate-50/50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
              <div className="col-span-1 ml-2">Rank</div>
              <div className="col-span-4">Candidate Details</div>
              <div className="col-span-2 text-center">Score Metric</div>
              <div className="col-span-3 text-center">Completion Time</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            <div className="divide-y divide-slate-50">
              {finalResults.map((result, index) => {
                const pct = Math.round((result.score / result.total_questions) * 100)
                const rank = index + 1
                return (
                  <div key={result.id} className="grid grid-cols-12 gap-4 px-10 py-6 items-center hover:bg-slate-50/30 transition-all group">
                    <div className="col-span-1">
                       <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                          rank === 1 ? "bg-amber-100 text-amber-600 ring-1 ring-amber-200" :
                          rank === 2 ? "bg-slate-100 text-slate-500 ring-1 ring-slate-200" :
                          rank === 3 ? "bg-orange-50 text-orange-600 ring-1 ring-orange-200" :
                          "text-slate-300 border border-slate-100"
                       )}>
                          {rank}
                       </div>
                    </div>
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {result.student?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 leading-none mb-1.5">{result.student?.name}</p>
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-100/50">Completed</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex flex-col items-center">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-black mb-1",
                        pct >= 75 ? "bg-emerald-50 text-emerald-600" : pct >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                      )}>
                        {pct}%
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{result.score} / {result.total_questions}</p>
                    </div>
                    <div className="col-span-3 text-center">
                       <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
                             <Clock className="w-3 h-3 text-slate-300" />
                             {new Date(result.submitted_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{new Date(result.submitted_at!).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="col-span-2 text-right">
                       <Link href={`/results/${result.id}`}>
                          <button className="px-5 h-10 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">
                             Full Review
                          </button>
                       </Link>
                    </div>
                  </div>
                )
              })}

              {finalResults.length === 0 && (
                <div className="text-center py-20 bg-slate-50/20">
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Waiting for Submissions...</p>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* 2. Live Tracking Table (Active Writing) */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-100">
               <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Live Assessment Tracking</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Candidates & Focus Violations</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-slate-50/50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
              <div className="col-span-4 ml-2">Active Candidate</div>
              <div className="col-span-2 text-center">Current Status</div>
              <div className="col-span-4 text-center">Activity Log</div>
              <div className="col-span-2 text-right">Management</div>
            </div>

            <div className="divide-y divide-slate-50">
              {liveResults.map((result) => (
                <div key={result.id} className="grid grid-cols-12 gap-4 px-10 py-6 items-center hover:bg-slate-50/30 transition-all group">
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {result.student?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 leading-none mb-1.5">{result.student?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Reg: {result.student?.registrationNumber}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                     <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        result.status === 'suspended' ? "bg-red-50 text-red-600 animate-pulse border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                     )}>
                        {result.status}
                     </span>
                  </div>
                  <div className="col-span-4 text-center">
                     {result.status === 'suspended' ? (
                        <div className="flex flex-col items-center">
                           <span className="text-red-500 font-black text-[10px] uppercase tracking-tighter mb-0.5">Focus Violation Detected</span>
                           <span className="text-[9px] text-slate-400 font-bold tracking-widest">{new Date(result.suspendedAt!).toLocaleTimeString()}</span>
                        </div>
                     ) : (
                        <div className="flex items-center justify-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                           <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Candidate Writing...</span>
                        </div>
                     )}
                  </div>
                  <div className="col-span-2 flex justify-end">
                     <ResumeTestButton attemptId={result.id} status={result.status} />
                  </div>
                </div>
              ))}

              {liveResults.length === 0 && (
                <div className="text-center py-20 bg-slate-50/20">
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Active Sessions</p>
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  )
}

function AlertCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

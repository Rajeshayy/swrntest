import { adminDb } from "@/lib/firebase/admin"
import { BookOpen, Sparkles, ChevronRight, User, GraduationCap, TrendingUp, Calendar, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default async function AdminResultsPage() {
  // Fetch all tests
  const testsSnapshot = await adminDb.collection('tests').orderBy('createdAt', 'desc').get()
  const tests = testsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    start_time: doc.data().start_time?.toDate ? doc.data().start_time.toDate().toISOString() : doc.data().start_time,
  }))

  // Fetch all attempts to calculate summaries per quiz
  const attemptsSnapshot = await adminDb.collection('testAttempts').get()
  const attempts = attemptsSnapshot.docs.map(doc => doc.data())

  const quizSummaries = tests.map(test => {
    const quizAttempts = attempts.filter(a => a.testId === test.id)
    const avgScore = quizAttempts.length > 0 
      ? Math.round(quizAttempts.reduce((acc, current) => acc + current.score, 0) / quizAttempts.length) 
      : 0
    
    return {
      ...test,
      participantCount: quizAttempts.length,
      averageScore: avgScore
    }
  })

  return (
    <div className="space-y-10 animate-slide-up p-4 min-h-screen bg-slate-50/30">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest leading-none">Administration</div>
             <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Quiz-wise Analytics</h2>
          <p className="text-slate-500 font-medium mt-1">Select a quiz to view the leaderboard and candidate performance.</p>
        </div>
      </div>

      {/* Quiz Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-12">
        {quizSummaries.map((quiz: any, index: number) => (
          <div 
            key={quiz.id}
            className="group bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shadow-sm group-hover:rotate-3 transition-transform">
                     <BookOpen className="w-7 h-7" />
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2 ${quiz.participantCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${quiz.participantCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                     {quiz.participantCount > 0 ? "Data Collected" : "No Attempts"}
                  </div>
               </div>

               <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight min-h-[56px] line-clamp-2">{quiz.title}</h3>
               
               <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                  <Calendar className="w-4 h-4" />
                  {quiz.start_time ? new Date(quiz.start_time).toLocaleDateString() : "No Date"}
               </div>

               <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidates</p>
                     <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-400" />
                        <span className="text-lg font-black text-slate-900">{quiz.participantCount}</span>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Score</p>
                     <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-lg font-black text-slate-900">{quiz.averageScore}%</span>
                     </div>
                  </div>
               </div>

               <Link href={`/admin/tests/${quiz.id}/results`} className="block mt-8">
                  <button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group/btn">
                     View Results
                     <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
               </Link>
            </div>
          </div>
        ))}

        {quizSummaries.length === 0 && (
          <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <BookOpen className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">No Quizzes Found</h3>
             <p className="text-slate-400 font-medium">Create a quiz in the Tests section to begin gathering data.</p>
          </div>
        )}
      </div>
    </div>
  )
}


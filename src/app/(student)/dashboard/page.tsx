import { adminDb } from "@/lib/firebase/admin"
import { Clock, BookOpen, FileText, CheckCircle, TrendingUp, Sparkles, ChevronRight, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { UserMenu } from "@/components/shared/user-menu"

export default async function StudentDashboard() {
  // Get the most recent upcoming or current test
  const testsSnapshot = await adminDb
    .collection('tests')
    .orderBy('start_time', 'asc')
    .where('start_time', '>=', new Date())
    .limit(1)
    .get()
  const availableTests = testsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    start_time: doc.data().start_time?.toDate().toISOString()
  }))

  return (
    <div className="space-y-10 animate-slide-up p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest leading-none">Student Portal</div>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Personal Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Summary of your current academic standing.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <Link href="/tests">
              <button className="flex items-center gap-2 px-6 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all button-hover border border-slate-200 shadow-sm">
                 <LayoutDashboard className="w-5 h-5" />
                 Explore Tests
              </button>
           </Link>
           <UserMenu />
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="flex items-center gap-6">
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex-1 max-w-sm">
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700" />
           <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100/50 flex items-center justify-center">
                 <Clock className="h-7 w-7 text-purple-600" />
              </div>
              <div className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-extrabold rounded-full uppercase tracking-wider">Active Status</div>
           </div>
           <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Upcoming Tests</p>
              <h3 className="text-4xl font-extrabold text-slate-900 leading-none">{availableTests.length}</h3>
           </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-12 pb-8">
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-200/60 shadow-md p-1 overflow-hidden">
           <div className="p-8 pb-4">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                 <Sparkles className="w-5 h-5 text-indigo-500" />
                 Ready for Evaluation?
              </h3>
              <p className="text-slate-400 text-sm font-medium">Available tests for your current curriculum.</p>
           </div>
           
           <div className="p-6 pt-2 h-[415px] overflow-y-auto space-y-3">
              {availableTests.length > 0 ? (
                availableTests.map((test: any, index: number) => (
                  <div key={test.id} className="flex items-center justify-between p-5 bg-slate-50/70 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-[1.5rem] transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 120}ms` }}>
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 shadow-sm relative overflow-hidden group">
                          <BookOpen className="w-5 h-5 relative z-10" />
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div>
                          <p className="text-base font-extrabold text-slate-900 leading-tight mb-0.5">{test.title}</p>
                          <div className="flex items-center gap-3 text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-none">
                             <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-indigo-400" />{new Date(test.start_time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                       </div>
                    </div>
                    <Link href={`/tests/${test.id}`}>
                      <button className="flex items-center gap-2 pl-6 pr-4 h-11 rounded-xl gradient-primary text-white font-bold text-xs shadow-lg shadow-indigo-100 button-hover transition-all">
                         Take Test
                         <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-extrabold text-xs tracking-widest uppercase">No available tests found</p>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 bg-indigo-600 rounded-[2rem] p-10 text-white shadow-xl shadow-indigo-100 overflow-hidden relative border border-white/10 group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-700" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -z-0" />
           
           <div className="relative z-10 h-full flex flex-col items-center text-center justify-center">
              <div className="w-20 h-20 rounded-[1.8rem] bg-white ring-8 ring-white/10 flex items-center justify-center shadow-xl mb-8 group-hover:rotate-6 transition-transform">
                 <Sparkles className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-extrabold mb-4 leading-tight px-2">Ready to Boost Your Grade?</h3>
              <p className="text-indigo-100/70 text-sm font-medium mb-10 leading-relaxed max-w-[240px]">Access expert study materials and mock exams instantly.</p>
              <button className="w-full h-14 rounded-2xl bg-white text-indigo-600 font-extrabold text-sm shadow-xl hover:bg-slate-50 transition-all button-hover border-b-4 border-slate-200">
                 View Study Guide
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}

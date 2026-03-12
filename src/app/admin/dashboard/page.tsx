import { adminDb } from "@/lib/firebase/admin"
import { Users, BookOpen, FileText, CheckCircle, TrendingUp, Sparkles, Plus, Clock, Search, ChevronRight } from "lucide-react"
import Link from "next/link"
import { UserMenu } from "@/components/shared/user-menu"

export default async function AdminDashboard() {
  const studentQuery = await adminDb.collection('profiles').where('role', '==', 'student').count().get()
  const studentCount = studentQuery.data().count

  const testQuery = await adminDb.collection('tests').count().get()
  const testCount = testQuery.data().count

  const attemptQuery = await adminDb.collection('testAttempts').count().get()
  const attemptCount = attemptQuery.data().count

  const recentResultsSnapshot = await adminDb
    .collection('testAttempts')
    .get()

  const allRecentResults = (await Promise.all(recentResultsSnapshot.docs.map(async (doc) => {
    const data = doc.data() as any
    if (!data.userId || typeof data.userId !== 'string' || !data.testId || typeof data.testId !== 'string' || !data.submittedAt) {
      return null
    }
    const studentDoc = await adminDb.collection('profiles').doc(data.userId).get()
    const testDoc = await adminDb.collection('tests').doc(data.testId).get()
    return {
      id: doc.id,
      score: data.score,
      submitted_at: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      submittedAtRaw: data.submittedAt?.toDate?.()?.getTime() || 0,
      profiles: studentDoc.data(),
      tests: testDoc.data()
    }
  }))).filter(Boolean) as any[]

  const recentResults = allRecentResults
    .sort((a, b) => b.submittedAtRaw - a.submittedAtRaw)
    .slice(0, 5)

  const recentStudentsSnapshot = await adminDb
    .collection('profiles')
    .where('role', '==', 'student')
    .get()
  
  const recentStudents = recentStudentsSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name || "Anonymous",
      email: data.email || "No Email",
      registrationNumber: data.registrationNumber || "",
      createdAtRaw: data.createdAt?.toDate?.()?.getTime() || 0,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }
  })
  .sort((a, b) => b.createdAtRaw - a.createdAtRaw)
  .slice(0, 5)

  const stats = [
    { name: "Total Students", value: studentCount || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50/50", iconBg: "bg-indigo-100", trend: "+12%" },
    { name: "Live Exams", value: testCount || 0, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50/50", iconBg: "bg-purple-100", trend: "+5%" },
    { name: "Global Attempts", value: attemptCount || 0, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50/50", iconBg: "bg-emerald-100", trend: "+18%" },
    { name: "Completion Rate", value: "98%", icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-50/50", iconBg: "bg-amber-100", trend: "+2%" },
  ]

  return (
    <div className="space-y-10 animate-slide-up p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="p-1 px-2 rounded-lg bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-widest">Administrator</div>
             <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time statistics for Online Examination System.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <Link href="/admin/tests">
              <button className="flex items-center gap-2 px-6 h-12 rounded-xl gradient-primary text-white font-bold text-sm shadow-lg shadow-indigo-100 button-hover">
                 <Plus className="w-5 h-5 text-indigo-100" />
                 Create New Test
              </button>
           </Link>
           <UserMenu />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div 
            key={stat.name} 
            className={`${stat.bg} rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3.5 rounded-2xl ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${stat.color} bg-white border border-slate-50 shadow-sm`}>
                <TrendingUp className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.name}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid gap-8 lg:grid-cols-12 pb-8">
        {/* Recent Activity & New Students */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden p-1">
            <div className="flex items-center justify-between p-7 pb-4">
               <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Recent Test Activity</h3>
                  <p className="text-slate-400 text-sm font-medium">Latest test submissions and metrics.</p>
               </div>
               <button className="text-slate-400 font-bold text-xs p-2 hover:bg-slate-50 rounded-xl transition-colors tracking-widest uppercase">View All</button>
            </div>
            
            <div className="overflow-x-auto p-4 pt-2">
               <div className="space-y-2">
                  {recentResults.map((result: any, index: number) => (
                    <div 
                      key={result.id} 
                      className="group flex items-center justify-between p-4.5 bg-slate-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-200 hover:shadow-sm transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center shadow-sm font-extrabold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            {result.profiles?.name?.[0]?.toUpperCase() || "U"}
                         </div>
                         <div>
                            <p className="text-[15px] font-extrabold text-slate-900 leading-tight">{result.profiles?.name || "Student"}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{result.tests?.title || "Exam"}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-8 px-4 text-right">
                         <div className="hidden sm:block">
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Score</p>
                            <p className="text-lg font-extrabold text-indigo-600 leading-none">{result.score}</p>
                         </div>
                         <div className="hidden md:block">
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">Date</p>
                            <p className="text-[13px] font-bold text-slate-600 leading-none">
                              {result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : "Pending"}
                            </p>
                         </div>
                         <Link href={`/results/${result.id}`}>
                            <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:scale-105 shadow-sm transition-all duration-300">
                               <ChevronRight className="w-5 h-5 -mr-0.5" />
                            </button>
                         </Link>
                      </div>
                    </div>
                  ))}
                  {!recentResults.length && (
                    <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                      <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">No Recent Activity Found</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden p-1">
            <div className="flex items-center justify-between p-7 pb-4">
               <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Newly Joined Students</h3>
                  <p className="text-slate-400 text-sm font-medium">Latest registrations in the system.</p>
               </div>
            </div>
            
            <div className="p-4 pt-2">
               <div className="grid sm:grid-cols-2 gap-4">
                  {recentStudents.map((student, index) => (
                    <div key={student.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white transition-all shadow-sm group">
                       <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {student.name?.[0]?.toUpperCase()}
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-extrabold text-slate-900 truncate leading-none mb-1">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                            {student.registrationNumber ? `Reg: ${student.registrationNumber}` : student.email}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full blur-3xl -z-0" />
              <div className="relative z-10">
                 <h3 className="text-2xl font-extrabold mb-1">Administrator Control</h3>
                 <p className="text-indigo-100/70 text-sm font-medium mb-8 leading-relaxed">System-wide configurations and management tools are available in the sidebar.</p>
                 <div className="flex flex-col gap-2.5">
                    <Link href="/admin/users" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all font-bold text-sm">
                       Manage Students
                       <Plus className="w-5 h-5" />
                    </Link>
                    <Link href="/admin/results" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all font-bold text-sm">
                       Global Metrics
                       <Search className="w-5 h-5" />
                    </Link>
                 </div>
              </div>
           </div>
           
           <div className="bg-white rounded-[2rem] p-7 border border-slate-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                 <h4 className="text-lg font-extrabold text-slate-900 mb-4">Support Center</h4>
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                       <Sparkles className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">System is optimized</p>
                       <p className="text-xs text-slate-400 font-medium">Auto-scaling active</p>
                    </div>
                 </div>
                 <button className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors">Contact Expert</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

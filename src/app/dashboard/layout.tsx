import { Sidebar } from "@/components/dashboard/sidebar"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background bg-grid">
      <Sidebar role="student" />
      <main className="flex-1 overflow-y-auto p-8 bg-radial-glow">
        {children}
      </main>
    </div>
  )
}

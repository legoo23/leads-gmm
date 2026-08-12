"use client"
import { useState } from "react"
import Sidebar from "./sidebar"
import Topbar from "./topbar"

interface ShellClientProps {
  user: { email: string; nombre: string; rol: string }
  rol: string
  children: React.ReactNode
}

export default function ShellClient({ user, rol, children }: ShellClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Mobile/tablet backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar rol={rol} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6"
          style={{ background: "var(--bg)" }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

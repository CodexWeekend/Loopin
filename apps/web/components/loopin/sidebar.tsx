"use client"

import { cn } from "@/lib/utils"
import {
  Briefcase,
  Compass,
  Clock,
  Users,
  User,
  Sparkles,
  ArrowRight,
} from "lucide-react"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "trips", label: "Trips", icon: Briefcase },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "now", label: "Now", icon: Clock },
  { id: "social", label: "Social", icon: Users },
  { id: "profile", label: "Profile", icon: User },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="flex w-[200px] flex-col border-r border-border bg-card">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Loopin</h1>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4">
        <div className="rounded-xl bg-muted p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1 text-sm font-medium text-foreground">
            Find more hidden gems
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Loopin surfaces thoughtful spots most travelers miss.
          </p>
          <button className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Learn more
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

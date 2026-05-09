"use client"

import Image from "next/image"
import type { Trip } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import {
  ChevronDown,
  Check,
  Share,
  Sun,
  Moon,
  Users,
  Heart,
  Sparkles,
  Settings,
  Plus,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { sampleUsers } from "@/lib/sample-data"

interface TripHeaderProps {
  trip: Trip
  onShare?: () => void
  onNewTrip?: () => void
}

export function TripHeader({ trip, onShare, onNewTrip }: TripHeaderProps) {
  const user = sampleUsers[0]

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted">
          <span className="text-lg font-semibold text-foreground">
            {trip.destination.name} Trip
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-1.5 text-sm text-primary">
          <Check className="h-4 w-4" />
          <span>Saved</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={onNewTrip}>
          <Plus className="h-4 w-4" />
          New Trip
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={onShare}>
          <Share className="h-4 w-4" />
          Share trip
        </Button>
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function TripOverview({ trip }: { trip: Trip }) {
  const startDate = parseISO(trip.startDate)
  const endDate = parseISO(trip.endDate)
  
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="relative h-28 w-40 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={trip.destination.image}
            alt={trip.destination.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-1 items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">
              {trip.destination.name}, {trip.destination.country}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")} • {trip.days.length} days
            </p>

            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">Party</span>
                <span className="font-medium text-foreground">
                  {trip.partySize} adults
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  $
                </div>
                <span className="text-xs text-muted-foreground">Budget</span>
                <span className="font-medium text-foreground capitalize">
                  {trip.preferences.budget}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">Interests</span>
                <span className="font-medium text-foreground capitalize">
                  {trip.preferences.interests.slice(0, 3).join(", ")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Itinerary
            </Button>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Adjust preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

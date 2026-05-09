// @ts-nocheck
"use client"

import { Place } from "@/lib/trip-data"
import { Button } from "@/components/ui/button"
import { Locate, Plus, Minus } from "lucide-react"

interface TripMapProps {
  stops: Place[]
  selectedStopId?: string
  onStopClick?: (stop: Place) => void
}

const mapMarkers = [
  { id: "1", top: "15%", left: "25%", number: 1 },
  { id: "2", top: "40%", left: "70%", number: 2 },
  { id: "3", top: "25%", left: "85%", number: 3 },
  { id: "4", top: "35%", left: "55%", number: 4 },
  { id: "5", top: "60%", left: "75%", number: 5 },
]

export function TripMap({ stops, selectedStopId, onStopClick }: TripMapProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#f0ede6]">
      {/* Simplified map background */}
      <div className="absolute inset-0">
        {/* Water areas */}
        <div className="absolute bottom-0 right-0 h-1/3 w-1/2 bg-[#c4dde3]/30" />
        
        {/* Major roads - simplified grid */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          {/* Horizontal roads */}
          <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#e5e5e5" strokeWidth="3" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e5e5e5" strokeWidth="3" />
          <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#e5e5e5" strokeWidth="3" />
          
          {/* Vertical roads */}
          <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#e5e5e5" strokeWidth="3" />
          <line x1="40%" y1="0" x2="40%" y2="100%" stroke="#e5e5e5" strokeWidth="3" />
          <line x1="60%" y1="0" x2="60%" y2="100%" stroke="#e5e5e5" strokeWidth="3" />
          <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#e5e5e5" strokeWidth="3" />

          {/* Route path */}
          <path
            d="M 80 60 Q 120 80 180 120 T 280 150 T 220 100 T 300 180"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray="8 4"
          />
        </svg>

        {/* Neighborhood labels */}
        <div className="absolute left-[15%] top-[10%] text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
          SHINJUKU
        </div>
        <div className="absolute right-[15%] top-[10%] text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
          CHIYODA
        </div>
        <div className="absolute left-[10%] top-[50%] text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
          SHIBUYA
        </div>
        <div className="absolute bottom-[20%] right-[15%] text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
          MINATO
        </div>
      </div>

      {/* Map markers */}
      {mapMarkers.map((marker) => (
        <button
          key={marker.id}
          className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg transition-transform hover:scale-110"
          style={{ top: marker.top, left: marker.left }}
        >
          {marker.number}
        </button>
      ))}

      {/* Map controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-card shadow-md"
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-card shadow-md"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-card shadow-md"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

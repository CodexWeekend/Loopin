// @ts-nocheck
"use client"

import Image from "next/image"
import { DayPlan, Place } from "@/lib/trip-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronUp,
  ChevronDown,
  Bookmark,
  MoreHorizontal,
  Footprints,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DayPlanCardProps {
  dayPlan: DayPlan
  isExpanded?: boolean
  onStopClick?: (stop: Place) => void
  selectedStopId?: string
}

const timeSlots = ["09:00", "11:00", "13:00", "15:30", "18:30"]

export function DayPlanCard({
  dayPlan,
  isExpanded: initialExpanded = true,
  onStopClick,
  selectedStopId,
}: DayPlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-left text-lg font-semibold text-foreground">
              Day {dayPlan.day}
            </h3>
            <p className="text-sm text-muted-foreground">{dayPlan.dateShort}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Est. cost</span>
            <Badge
              variant="outline"
              className="ml-2 bg-muted font-semibold text-foreground"
            >
              ${dayPlan.estimatedCost}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-0">
            {dayPlan.stops.map((stop, index) => (
              <StopItem
                key={stop.id}
                stop={stop}
                time={timeSlots[index] || "20:00"}
                isLast={index === dayPlan.stops.length - 1}
                onClick={() => onStopClick?.(stop)}
                isSelected={selectedStopId === stop.id}
              />
            ))}
          </div>

          <button className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" />
            Add stop
          </button>
        </div>
      )}
    </div>
  )
}

interface StopItemProps {
  stop: Place
  time: string
  isLast?: boolean
  onClick?: () => void
  isSelected?: boolean
}

function StopItem({ stop, time, isLast, onClick, isSelected }: StopItemProps) {
  return (
    <div
      className={cn(
        "flex cursor-pointer gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
      onClick={onClick}
    >
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="flex h-6 w-14 items-center justify-center text-sm text-muted-foreground">
          {time}
        </div>
        <div className="mt-1 h-3 w-3 rounded-full border-2 border-muted-foreground bg-card" />
        {!isLast && <div className="h-full w-0.5 flex-1 bg-border" />}
      </div>

      {/* Stop image */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={stop.image}
          alt={stop.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Stop info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-medium text-foreground">{stop.name}</h4>
          {stop.isHiddenGem && (
            <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/20">
              <Sparkles className="h-3 w-3" />
              Hidden gem
            </Badge>
          )}
          {stop.category === "Food & Drinks" &&
            !stop.isHiddenGem &&
            stop.id === "omoide-yokocho" && (
              <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/30">
                Food & Drinks
              </Badge>
            )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {stop.description}
        </p>

        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          {stop.distance && stop.distance !== "0 km" && (
            <div className="flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5" />
              {stop.distance}
            </div>
          )}
          {stop.duration && stop.duration !== "0 min" && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {stop.duration}
            </div>
          )}
          <Badge
            variant="outline"
            className="rounded-full px-2 py-0.5 text-xs font-medium"
          >
            ${stop.cost}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bookmark className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  ChevronUp,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Footprints,
  Clock,
  Plus,
  Sparkles,
  Trash2,
  ArrowUpDown,
  GripVertical,
  Train,
  X,
  Info,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Trip, DayPlan, DayStop, Place, SwapSuggestion } from "@/lib/types"
import { swapSuggestions, places } from "@/lib/sample-data"

interface ItineraryViewProps {
  trip: Trip
  selectedStopId?: string
  onRegenerate?: () => void
  onStopSelect?: (stop: DayStop) => void
  onStopRemove?: (dayIndex: number, stopId: string) => void
  onStopSwap?: (dayIndex: number, stopId: string, newPlace: Place) => void
  onAddStop?: (dayIndex: number) => void
}

export function ItineraryView({
  trip,
  selectedStopId,
  onRegenerate,
  onStopSelect,
  onStopRemove,
  onStopSwap,
  onAddStop,
}: ItineraryViewProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([0])

  const toggleDay = (index: number) => {
    setExpandedDays((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const totalCost = trip.days.reduce((sum, day) => sum + day.estimatedCost, 0)

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-6">
        {/* Trip Summary */}
        <TripSummary trip={trip} totalCost={totalCost} onRegenerate={onRegenerate} />

        {/* Day Plans */}
        {trip.days.map((dayPlan, dayIndex) => (
          <DayPlanCard
            key={dayPlan.id}
            dayPlan={dayPlan}
            dayIndex={dayIndex}
            isExpanded={expandedDays.includes(dayIndex)}
            onToggle={() => toggleDay(dayIndex)}
            selectedStopId={selectedStopId}
            onStopSelect={onStopSelect}
            onStopRemove={(stopId) => onStopRemove?.(dayIndex, stopId)}
            onStopSwap={(stopId, newPlace) => onStopSwap?.(dayIndex, stopId, newPlace)}
            onAddStop={() => onAddStop?.(dayIndex)}
          />
        ))}

        {/* Add day button */}
        <Button variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add another day
        </Button>
      </div>
    </ScrollArea>
  )
}

// ============ Trip Summary ============
function TripSummary({
  trip,
  totalCost,
  onRegenerate,
}: {
  onRegenerate?: () => void
  totalCost: number
  trip: Trip
}) {
  const startDate = parseISO(trip.startDate)
  const endDate = parseISO(trip.endDate)

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-4">
        <div className="relative h-24 w-32 min-h-24 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={trip.destination.image}
            alt={trip.destination.name}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-primary">
            {trip.destination.name}, {trip.destination.country}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")} • {trip.days.length} days
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Party: </span>
              <span className="font-medium">{trip.partySize} adults</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium">${totalCost}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Style: </span>
              <span className="font-medium capitalize">{trip.preferences.hiddenGemPreference}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="gap-2" onClick={onRegenerate}>
            <Sparkles className="h-4 w-4" />
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ Day Plan Card ============
interface DayPlanCardProps {
  dayPlan: DayPlan
  dayIndex: number
  isExpanded: boolean
  onToggle: () => void
  selectedStopId?: string
  onStopSelect?: (stop: DayStop) => void
  onStopRemove?: (stopId: string) => void
  onStopSwap?: (stopId: string, newPlace: Place) => void
  onAddStop?: () => void
}

function DayPlanCard({
  dayPlan,
  dayIndex,
  isExpanded,
  onToggle,
  selectedStopId,
  onStopSelect,
  onStopRemove,
  onStopSwap,
  onAddStop,
}: DayPlanCardProps) {
  const date = parseISO(dayPlan.date)
  
  return (
    <div className="rounded-xl border bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {dayPlan.day}
          </div>
          <div>
            <h3 className="font-semibold">Day {dayPlan.day}</h3>
            <p className="text-sm text-muted-foreground">
              {format(date, "EEEE, MMM d")}
            </p>
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
            {dayPlan.stops.map((stop, stopIndex) => (
              <StopItem
                key={stop.id}
                stop={stop}
                isLast={stopIndex === dayPlan.stops.length - 1}
                isSelected={selectedStopId === stop.id}
                onClick={() => onStopSelect?.(stop)}
                onRemove={() => onStopRemove?.(stop.id)}
                onSwap={onStopSwap ? (newPlace) => onStopSwap(stop.id, newPlace) : undefined}
              />
            ))}
          </div>

          <button
            onClick={onAddStop}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add stop
          </button>
        </div>
      )}
    </div>
  )
}

// ============ Stop Item ============
interface StopItemProps {
  stop: DayStop
  isLast?: boolean
  isSelected?: boolean
  onClick?: () => void
  onRemove?: () => void
  onSwap?: (newPlace: Place) => void
}

function StopItem({
  stop,
  isLast,
  isSelected,
  onClick,
  onRemove,
  onSwap,
}: StopItemProps) {
  const [showSwapSuggestion, setShowSwapSuggestion] = useState(false)
  
  const swapSuggestion = swapSuggestions.find(
    (s) => s.originalPlace.id === stop.place.id
  )

  return (
    <div className="relative">
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
            {stop.startTime}
          </div>
          <div className="mt-1 h-3 w-3 rounded-full border-2 border-primary bg-card" />
          {!isLast && (
            <div className="relative h-full w-0.5 flex-1 bg-border">
              {stop.travelFromPrevious && stop.travelFromPrevious.duration > 0 && (
                <div className="absolute -left-8 top-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Train className="h-3 w-3" />
                  {stop.travelFromPrevious.duration}m
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stop image */}
        <div className="relative h-16 w-16 min-h-16 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={stop.place.image}
            alt={stop.place.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        {/* Stop info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-medium">{stop.place.name}</h4>
            {stop.place.hiddenness === "hidden" && (
              <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                <Sparkles className="h-3 w-3" />
                Hidden gem
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {stop.place.description}
          </p>

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            {stop.travelFromPrevious && stop.travelFromPrevious.distance > 0 && (
              <div className="flex items-center gap-1">
                <Footprints className="h-3.5 w-3.5" />
                {stop.travelFromPrevious.distance} km
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {stop.place.typicalDuration} min
            </div>
            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs font-medium">
              ${stop.place.estimatedCost}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {}}
          >
            {stop.isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSwapSuggestion(true)}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Smart swap
              </DropdownMenuItem>
              <DropdownMenuItem>
                <GripVertical className="mr-2 h-4 w-4" />
                Reorder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline swap suggestion */}
      {showSwapSuggestion && swapSuggestion && (
        <div className="ml-20 mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Smart swap suggestion</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowSwapSuggestion(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex gap-3">
            <div className="relative h-14 w-14 min-h-14 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={swapSuggestion.suggestedPlace.image}
                alt={swapSuggestion.suggestedPlace.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">{swapSuggestion.suggestedPlace.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {swapSuggestion.suggestedPlace.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {swapSuggestion.timeDifference > 0 ? "+" : ""}
                {swapSuggestion.timeDifference} min walk
                {" • "}
                <span className="text-primary">
                  {swapSuggestion.costDifference < 0
                    ? `Save $${Math.abs(swapSuggestion.costDifference)}`
                    : `+$${swapSuggestion.costDifference}`}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowSwapSuggestion(false)}
            >
              Keep original
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                onSwap?.(swapSuggestion.suggestedPlace)
                setShowSwapSuggestion(false)
              }}
            >
              Swap it in
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Place Detail Panel ============
interface PlaceDetailPanelProps {
  stop: DayStop
  onClose: () => void
  onSwap?: (newPlace: Place) => void
}

export function PlaceDetailPanel({ stop, onClose, onSwap }: PlaceDetailPanelProps) {
  const swapSuggestion = swapSuggestions.find(
    (s) => s.originalPlace.id === stop.place.id
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Place card */}
      <div className="rounded-xl border bg-card">
        <div className="relative">
          {stop.place.hiddenness === "hidden" && (
            <Badge className="absolute left-3 top-3 z-10 gap-1 bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
              Hidden gem
            </Badge>
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur hover:bg-card"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative h-36 w-full min-h-36 overflow-hidden rounded-t-xl">
            <Image
              src={stop.place.image}
              alt={stop.place.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 400px"
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold">{stop.place.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {stop.place.neighborhood}, {stop.place.address}
          </p>
          <p className="mt-3 text-sm">
            {stop.place.longDescription || stop.place.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {stop.place.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </div>

          {stop.place.bestFor && stop.place.bestFor.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Best for</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {stop.place.bestFor.map((b) => (
                  <span key={b} className="text-sm">{b}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{stop.place.openHours?.monday || "Open now"}</span>
            </div>
            <span className="text-sm font-medium">
              {stop.place.estimatedCost === 0 ? "Free" : `$${stop.place.estimatedCost}`}
            </span>
          </div>
        </div>
      </div>

      {/* Smart swap suggestion */}
      {swapSuggestion && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Smart swap suggestion</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 min-h-16 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={swapSuggestion.suggestedPlace.image}
                  alt={swapSuggestion.suggestedPlace.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  Swap{" "}
                  <span className="font-semibold">{swapSuggestion.originalPlace.name}</span>
                  {" "}with{" "}
                  <span className="font-semibold">{swapSuggestion.suggestedPlace.name}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {swapSuggestion.suggestedPlace.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {swapSuggestion.timeDifference > 0 ? "+" : ""}
                  {swapSuggestion.timeDifference} min walk
                  {" • "}
                  <span className="text-primary">
                    {swapSuggestion.costDifference < 0
                      ? `Save $${Math.abs(swapSuggestion.costDifference)}`
                      : `+$${swapSuggestion.costDifference}`}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1">
                Keep original
              </Button>
              <Button
                className="flex-1"
                onClick={() => onSwap?.(swapSuggestion.suggestedPlace)}
              >
                Swap it in
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 border-t p-4 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>
              Loopin analyzes time, cost, and hiddenness to improve your day.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

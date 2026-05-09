"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  MapPin,
  Clock,
  Sparkles,
  CloudRain,
  Moon,
  Coffee,
  Navigation,
  ChevronRight,
  Footprints,
  Plus,
  Star,
  Zap,
  SkipForward,
  ArrowRight,
} from "lucide-react"
import type { Place, DayStop, QuickAction, NearMeSuggestion } from "@/lib/types"
import { places, quickActions, nearMeSuggestions, sampleTrip } from "@/lib/sample-data"

interface NowViewProps {
  currentLocation?: { lat: number; lng: number }
  onPlaceSelect?: (place: Place) => void
  onAddToDay?: (place: Place) => void
  onSkipStop?: (stopId: string) => void
}

export function NowView({
  currentLocation,
  onPlaceSelect,
  onAddToDay,
  onSkipStop,
}: NowViewProps) {
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null)

  // Simulated current day plan
  const currentDay = sampleTrip.days[0]
  const currentStopIndex = 2 // Simulating we're at stop 3
  const currentStop = currentDay?.stops[currentStopIndex]
  const nextStop = currentDay?.stops[currentStopIndex + 1]
  const upcomingStops = currentDay?.stops.slice(currentStopIndex + 1) || []

  // Filter suggestions based on quick action
  const filteredSuggestions = activeQuickAction
    ? nearMeSuggestions.filter((s) => {
        const action = quickActions.find((a) => a.id === activeQuickAction)
        if (!action) return true
        if (action.id === "hidden-gems") return s.place.hiddenness === "hidden"
        if (action.id === "coffee-break") return s.place.category === "cafe"
        return true
      })
    : nearMeSuggestions

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Now</h1>
            <p className="text-sm text-muted-foreground">
              Explore near you in {sampleTrip.destination.name}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">Shinjuku</span>
          </div>
        </div>

        {/* Current progress */}
        {currentStop && (
          <div className="mt-4 rounded-xl bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {currentStopIndex + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">Currently at</p>
                  <p className="text-sm text-muted-foreground">{currentStop.place.name}</p>
                </div>
              </div>
              {nextStop && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Next:</span>
                  <span className="font-medium text-foreground">{nextStop.place.name}</span>
                  <Badge variant="outline" className="ml-1">
                    {nextStop.travelFromPrevious?.duration || 10}m
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Quick actions */}
          <div>
            <h2 className="mb-3 font-semibold">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const isActive = activeQuickAction === action.id
                return (
                  <Button
                    key={action.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveQuickAction(isActive ? null : action.id)}
                    className="gap-2"
                  >
                    {action.id === "fill-hour" && <Clock className="h-4 w-4" />}
                    {action.id === "rainy-day" && <CloudRain className="h-4 w-4" />}
                    {action.id === "late-night" && <Moon className="h-4 w-4" />}
                    {action.id === "coffee-break" && <Coffee className="h-4 w-4" />}
                    {action.id === "hidden-gems" && <Sparkles className="h-4 w-4" />}
                    {action.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Today's remaining plan */}
          {upcomingStops.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Today&apos;s Plan</h2>
                <span className="text-sm text-muted-foreground">
                  {upcomingStops.length} stops left
                </span>
              </div>
              <div className="space-y-2">
                {upcomingStops.slice(0, 3).map((stop, index) => (
                  <TodayStopCard
                    key={stop.id}
                    stop={stop}
                    index={currentStopIndex + index + 2}
                    onSkip={() => onSkipStop?.(stop.id)}
                  />
                ))}
                {upcomingStops.length > 3 && (
                  <Button variant="ghost" className="w-full gap-2">
                    View all {upcomingStops.length} stops
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Near me suggestions */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">
                {activeQuickAction
                  ? quickActions.find((a) => a.id === activeQuickAction)?.label
                  : "Near You"}
              </h2>
              <Button variant="ghost" size="sm" className="gap-1">
                View map
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {filteredSuggestions.map((suggestion, index) => (
                <NearMeCard
                  key={suggestion.place.id}
                  suggestion={suggestion}
                  rank={index + 1}
                  onClick={() => onPlaceSelect?.(suggestion.place)}
                  onAdd={() => onAddToDay?.(suggestion.place)}
                />
              ))}
            </div>
          </div>

          {/* Skip current stop */}
          {currentStop && (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <SkipForward className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Plans changed?</p>
                    <p className="text-sm text-muted-foreground">
                      Skip current stop and find alternatives
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => onSkipStop?.(currentStop.id)}>
                  Skip & swap
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============ Sub-components ============

interface TodayStopCardProps {
  stop: DayStop
  index: number
  onSkip?: () => void
}

function TodayStopCard({ stop, index, onSkip }: TodayStopCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
        {index}
      </div>
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={stop.place.image}
          alt={stop.place.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{stop.place.name}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{stop.startTime}</span>
          {stop.travelFromPrevious && stop.travelFromPrevious.duration > 0 && (
            <>
              <span>•</span>
              <span>{stop.travelFromPrevious.duration}m away</span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkip}
        className="flex-shrink-0 text-muted-foreground"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface NearMeCardProps {
  suggestion: NearMeSuggestion
  rank: number
  onClick?: () => void
  onAdd?: () => void
}

function NearMeCard({ suggestion, rank, onClick, onAdd }: NearMeCardProps) {
  const { place, distance, matchScore, reason, estimatedArrival, fitsTimeSlot } = suggestion

  return (
    <div
      className="cursor-pointer rounded-xl border bg-card p-3 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={place.image}
            alt={place.name}
            fill
            className="object-cover"
          />
          {place.hiddenness === "hidden" && (
            <div className="absolute left-1 top-1 rounded-full bg-primary p-1">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          {rank <= 3 && (
            <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs font-bold shadow">
              {rank}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium">{place.name}</h4>
              <p className="mt-0.5 text-sm text-muted-foreground">{place.neighborhood}</p>
            </div>
            {fitsTimeSlot && (
              <Badge className="flex-shrink-0 gap-1 bg-primary/10 text-primary">
                <Zap className="h-3 w-3" />
                Fits now
              </Badge>
            )}
          </div>

          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {reason}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Footprints className="h-3 w-3" />
                {distance.toFixed(1)} km
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {estimatedArrival}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                {matchScore}% match
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onAdd?.()
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

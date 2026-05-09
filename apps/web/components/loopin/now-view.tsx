"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"
import type { Place, DayPlan, DayStop, QuickAction, NearMeSuggestion } from "@/lib/types"
import { nearMeSuggestions, quickActions, sampleTrip } from "@/lib/sample-data"

interface NowViewProps {
  currentLocation?: { lat: number; lng: number }
  cityName?: string
  currentNeighborhoodLabel?: string
  currentDay?: DayPlan
  currentStopIndex?: number
  suggestions?: NearMeSuggestion[]
  quickActions?: QuickAction[]
  onPlaceSelect?: (place: Place) => void
  onAddToDay?: (place: Place) => void
  onSkipStop?: (stopId: string) => void
}

export function NowView({
  currentLocation,
  cityName,
  currentNeighborhoodLabel,
  currentDay: providedCurrentDay,
  currentStopIndex = 2,
  suggestions: providedSuggestions,
  quickActions: providedQuickActions,
  onPlaceSelect,
  onAddToDay,
  onSkipStop,
}: NowViewProps) {
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null)

  const activeQuickActions = providedQuickActions ?? quickActions
  const activeSuggestions = providedSuggestions ?? nearMeSuggestions
  const currentDay = providedCurrentDay ?? sampleTrip.days[0]
  const safeCurrentStopIndex = Math.min(
    Math.max(currentStopIndex, 0),
    Math.max((currentDay?.stops.length ?? 1) - 1, 0),
  )
  const currentStop = currentDay?.stops[safeCurrentStopIndex]
  const nextStop = currentDay?.stops[safeCurrentStopIndex + 1]
  const upcomingStops = currentDay?.stops.slice(safeCurrentStopIndex + 1) || []
  const currentCityName = cityName ?? sampleTrip.destination.name
  const activeLocationLabel =
    currentNeighborhoodLabel ??
    currentStop?.place.neighborhood ??
    (currentLocation ? "Current area" : "Nearby")

  const filteredSuggestions = activeQuickAction
    ? filterSuggestionsForAction(
        activeSuggestions,
        activeQuickActions.find((action) => action.id === activeQuickAction),
      )
    : activeSuggestions

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Now</h1>
            <p className="text-sm text-muted-foreground">
              Explore near you in {currentCityName}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">{activeLocationLabel}</span>
          </div>
        </div>

        {/* Current progress */}
        {currentStop && (
          <div className="mt-4 rounded-xl bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {safeCurrentStopIndex + 1}
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
              {activeQuickActions.map((action) => {
                const isActive = activeQuickAction === action.id
                return (
                  <Button
                    key={action.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveQuickAction(isActive ? null : action.id)}
                    className="gap-2"
                  >
                    {renderQuickActionIcon(action.id)}
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
                    index={safeCurrentStopIndex + index + 2}
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
                  ? activeQuickActions.find((action) => action.id === activeQuickAction)?.label
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

function filterSuggestionsForAction(
  suggestions: NearMeSuggestion[],
  action?: QuickAction,
) {
  if (!action) {
    return suggestions
  }

  return suggestions.filter((suggestion) => {
    const matchesCategory =
      !action.filters.categories ||
      action.filters.categories.includes(suggestion.place.category)
    const matchesDistance =
      !action.filters.maxDistance ||
      suggestion.distance <= action.filters.maxDistance
    const matchesDuration =
      !action.filters.maxDuration ||
      suggestion.place.typicalDuration <= action.filters.maxDuration
    const matchesHiddenGem =
      action.id !== "hidden-gems" || suggestion.place.hiddenness === "hidden"

    return matchesCategory && matchesDistance && matchesDuration && matchesHiddenGem
  })
}

function renderQuickActionIcon(actionId: QuickAction["id"]) {
  switch (actionId) {
    case "fill-hour":
      return <Clock className="h-4 w-4" />
    case "rainy-day":
      return <CloudRain className="h-4 w-4" />
    case "late-night":
      return <Moon className="h-4 w-4" />
    case "coffee-break":
      return <Coffee className="h-4 w-4" />
    case "hidden-gems":
      return <Sparkles className="h-4 w-4" />
    default:
      return null
  }
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
              <span>-</span>
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

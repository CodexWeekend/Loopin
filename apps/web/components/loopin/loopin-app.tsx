"use client"

import { useState, useCallback, useMemo } from "react"
import { Sidebar } from "@/components/loopin/sidebar"
import { TripHeader } from "@/components/loopin/trip-header"
import { ItineraryView, PlaceDetailPanel } from "@/components/loopin/itinerary-view"
import { ExploreView } from "@/components/loopin/explore-view"
import { NowView } from "@/components/loopin/now-view"
import { SocialView } from "@/components/loopin/social-view"
import { ProfileView } from "@/components/loopin/profile-view"
import { MapView } from "@/components/loopin/map-view"
import { TripWizard } from "@/components/loopin/trip-wizard"
import { ShareDialog } from "@/components/loopin/share-dialog"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Compass } from "lucide-react"
import type { Trip, DayStop, Place, User as AppUser } from "@/lib/types"
import { sampleTrip as initialTrip, sampleUsers, cities, places, swapSuggestions } from "@/lib/sample-data"

type ActiveTab = "trips" | "explore" | "now" | "social" | "profile"

export default function LoopinApp() {
  const { user, profile, isLoading, signOut } = useAuth()

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>("trips")
  
  // Trip state
  const [currentTrip, setCurrentTrip] = useState<Trip>(initialTrip)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedStop, setSelectedStop] = useState<DayStop | null>(
    initialTrip.days[0]?.stops[0] || null
  )
  
  // Dialog state
  const [isTripWizardOpen, setIsTripWizardOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  // Create current user from auth or fallback to sample - MUST be before any conditional returns
  const currentUser: AppUser = useMemo(() => {
    if (user) {
      return {
        createdAt: new Date(user.created_at),
        email: user.email || "",
        id: user.id,
        name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.first_name || user.email?.split("@")[0] || "Traveler",
        avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        interests: (profile?.interests as AppUser["interests"]) || [],
        visibility: {
          allowMessages: true,
          showInCityLobby: true,
          showPlannedPlaces: true,
        },
      }
    }
    return sampleUsers[0]
  }, [user, profile])

  // Get all stops for the map - MUST be before any conditional returns
  const allStops = useMemo(() => currentTrip.days.flatMap((day) => day.stops), [currentTrip.days])
  const currentDayStops = useMemo(() => currentTrip.days[selectedDayIndex]?.stops || [], [currentTrip.days, selectedDayIndex])

  // All handlers MUST be defined before any conditional returns
  const handleStopSelect = useCallback((stop: DayStop) => {
    setSelectedStop(stop)
  }, [])

  const handleStopRemove = useCallback((dayIndex: number, stopId: string) => {
    setCurrentTrip((prev) => {
      const newDays = [...prev.days]
      const day = newDays[dayIndex]
      const removedStop = day.stops.find((s) => s.id === stopId)
      newDays[dayIndex] = {
        ...day,
        stops: day.stops.filter((s) => s.id !== stopId),
        estimatedCost: day.estimatedCost - (removedStop?.place.estimatedCost || 0),
      }
      return { ...prev, days: newDays }
    })
    setSelectedStop((prev) => prev?.id === stopId ? null : prev)
  }, [])

  const handleStopSwap = useCallback((dayIndex: number, stopId: string, newPlace: Place) => {
    setCurrentTrip((prev) => {
      const newDays = [...prev.days]
      const day = newDays[dayIndex]
      const oldStop = day.stops.find((s) => s.id === stopId)
      if (!oldStop) return prev

      const newStop: DayStop = {
        ...oldStop,
        id: `stop-${Date.now()}`,
        place: newPlace,
      }

      const costDiff = newPlace.estimatedCost - oldStop.place.estimatedCost
      newDays[dayIndex] = {
        ...day,
        stops: day.stops.map((s) => (s.id === stopId ? newStop : s)),
        estimatedCost: day.estimatedCost + costDiff,
      }

      return { ...prev, days: newDays }
    })
  }, [])

  const handleTripCreate = useCallback((trip: Trip) => {
    setCurrentTrip(trip)
    setSelectedDayIndex(0)
    setSelectedStop(null)
    setIsTripWizardOpen(false)
  }, [])

  const handlePlaceSelect = useCallback((place: Place) => {
    // Create a temporary stop for the detail view
    const tempStop: DayStop = {
      id: `temp-${place.id}`,
      place,
      startTime: "00:00",
      endTime: "00:00",
      order: 0,
      isBookmarked: false,
    }
    setSelectedStop(tempStop)
  }, [])

  const handleAddToTrip = useCallback((place: Place) => {
    // Add to first day for demo
    const newStop: DayStop = {
      id: `stop-${Date.now()}`,
      place,
      startTime: "20:00",
      endTime: "21:00",
      order: currentTrip.days[0].stops.length + 1,
      isBookmarked: false,
    }
    setCurrentTrip((prev) => ({
      ...prev,
      days: prev.days.map((d, i) =>
        i === 0
          ? {
              ...d,
              stops: [...d.stops, newStop],
              estimatedCost: d.estimatedCost + place.estimatedCost,
            }
          : d
      ),
    }))
  }, [currentTrip.days])

  const handleAddToDay = useCallback((place: Place) => {
    const newStop: DayStop = {
      id: `stop-${Date.now()}`,
      place,
      startTime: "Now",
      endTime: "",
      order: 0,
      isBookmarked: false,
    }
    setCurrentTrip((prev) => ({
      ...prev,
      days: prev.days.map((d, i) =>
        i === selectedDayIndex
          ? {
              ...d,
              stops: [...d.stops, newStop],
              estimatedCost: d.estimatedCost + place.estimatedCost,
            }
          : d
      ),
    }))
  }, [selectedDayIndex])

  const handleSwapInDetail = useCallback((newPlace: Place) => {
    if (!selectedStop) return
    const dayIndex = currentTrip.days.findIndex((d) =>
      d.stops.some((s) => s.id === selectedStop.id)
    )
    if (dayIndex >= 0) {
      handleStopSwap(dayIndex, selectedStop.id, newPlace)
    }
  }, [selectedStop, currentTrip.days, handleStopSwap])

  // Show loading state - AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Compass className="h-9 w-9 text-primary-foreground" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as ActiveTab)} 
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - only show for trips view */}
        {activeTab === "trips" && (
          <TripHeader 
            trip={currentTrip} 
            onShare={() => setIsShareDialogOpen(true)}
            onNewTrip={() => setIsTripWizardOpen(true)}
          />
        )}

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Trips view - Itinerary + Map */}
          {activeTab === "trips" && (
            <>
              {/* Itinerary section */}
              <div className="flex w-[600px] flex-col border-r border-border bg-card">
                <ItineraryView
                  trip={currentTrip}
                  selectedStopId={selectedStop?.id}
                  onStopSelect={handleStopSelect}
                  onStopRemove={handleStopRemove}
                  onStopSwap={handleStopSwap}
                />
              </div>

              {/* Map and detail section */}
              <div className="flex flex-1 flex-col">
                {/* Map */}
                <div className="h-[50%] border-b border-border p-4">
                  <MapView
                    stops={allStops}
                    selectedStopId={selectedStop?.id}
                    onStopClick={handleStopSelect}
                    showRoute
                  />
                </div>

                {/* Place detail */}
                <div className="flex-1 overflow-auto p-4">
                  {selectedStop ? (
                    <PlaceDetailPanel
                      stop={selectedStop}
                      onClose={() => setSelectedStop(null)}
                      onSwap={handleSwapInDetail}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="text-muted-foreground">
                        Select a stop to see details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Explore view */}
          {activeTab === "explore" && (
            <div className="flex flex-1">
              <div className="w-[500px] border-r border-border">
                <ExploreView
                  city={cities[0]}
                  onPlaceSelect={handlePlaceSelect}
                  onAddToTrip={handleAddToTrip}
                />
              </div>
              <div className="flex-1 p-4">
                <MapView
                  places={places}
                  selectedStopId={selectedStop?.place.id}
                  onPlaceClick={handlePlaceSelect}
                  showRoute={false}
                />
              </div>
            </div>
          )}

          {/* Now view */}
          {activeTab === "now" && (
            <div className="flex flex-1">
              <div className="w-[450px] border-r border-border">
                <NowView
                  onPlaceSelect={handlePlaceSelect}
                  onAddToDay={handleAddToDay}
                />
              </div>
              <div className="flex-1 p-4">
                <MapView
                  stops={currentDayStops}
                  places={places.slice(0, 8)}
                  selectedStopId={selectedStop?.id}
                  onStopClick={handleStopSelect}
                  showRoute
                />
              </div>
            </div>
          )}

          {/* Social view */}
          {activeTab === "social" && (
            <div className="flex-1">
              <SocialView
                currentUser={currentUser}
                onConnect={(userId) => console.log("Connect:", userId)}
                onMessage={(userId) => console.log("Message:", userId)}
              />
            </div>
          )}

          {/* Profile view */}
          {activeTab === "profile" && (
            <div className="flex-1">
              <ProfileView
                user={currentUser}
                trips={[currentTrip]}
                onEditProfile={() => console.log("Edit profile")}
                onLogout={signOut}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <TripWizard
        open={isTripWizardOpen}
        onClose={() => setIsTripWizardOpen(false)}
        onComplete={handleTripCreate}
      />

      <ShareDialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        trip={currentTrip}
      />
    </div>
  )
}

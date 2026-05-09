"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
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
import { fetchLoopinAppState, runLoopinAction } from "@/lib/loopin-api"
import type { LoopinAppState } from "@/lib/loopin-api"
import { Loader2, Compass } from "lucide-react"
import type { DayStop, InterestType, Place, Trip, VisibilitySettings } from "@/lib/types"

type ActiveTab = "trips" | "explore" | "now" | "social" | "profile"
type InviteRole = "editor" | "viewer"
type SelectedDetailState =
  | { kind: "place"; place: Place }
  | { kind: "stop"; stopId: string }
  | null

const ALL_INTERESTS: InterestType[] = [
  "food",
  "culture",
  "nightlife",
  "nature",
  "shopping",
  "work-friendly",
  "art",
  "history",
  "photography",
]

export default function LoopinApp({
  initialTripId,
}: {
  initialTripId?: string
}) {
  const { isLoading, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>("trips")
  const [appState, setAppState] = useState<LoopinAppState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetailState>(null)
  const [isTripWizardOpen, setIsTripWizardOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [intentDraft, setIntentDraft] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<InviteRole>("viewer")

  useEffect(() => {
    if (isLoading) {
      return
    }

    void loadAppState(initialTripId)
  }, [initialTripId, isLoading])

  const currentTrip = appState?.currentTrip ?? null

  useEffect(() => {
    if (!currentTrip) {
      return
    }

    const targetPath = `/trips/${currentTrip.id}`

    if (pathname !== targetPath) {
      router.replace(targetPath)
    }
  }, [currentTrip?.id, pathname, router])

  useEffect(() => {
    if (!currentTrip) {
      return
    }

    setSelectedDayIndex((currentIndex) => {
      if (currentIndex < currentTrip.days.length) {
        return currentIndex
      }

      return Math.max(0, currentTrip.days.length - 1)
    })

    if (selectedDetail?.kind === "stop") {
      const stillExists = currentTrip.days.some((day) =>
        day.stops.some((stop) => stop.id === selectedDetail.stopId),
      )

      if (!stillExists) {
        setSelectedDetail(null)
      }
    }
  }, [currentTrip, selectedDetail])

  const currentUser = appState?.currentUser ?? null
  const allStops = useMemo(
    () => currentTrip?.days.flatMap((day) => day.stops) ?? [],
    [currentTrip],
  )
  const currentDay = currentTrip?.days[selectedDayIndex] ?? null
  const currentDayStops = currentDay?.stops ?? []
  const selectedStop = useMemo(() => {
    if (!currentTrip || !selectedDetail) {
      return null
    }

    if (selectedDetail.kind === "place") {
      return {
        endTime: "",
        id: `preview-${selectedDetail.place.id}`,
        isBookmarked: false,
        order: 0,
        place: selectedDetail.place,
        startTime: "Now",
      } satisfies DayStop
    }

    for (const day of currentTrip.days) {
      const stop = day.stops.find((candidate) => candidate.id === selectedDetail.stopId)

      if (stop) {
        return stop
      }
    }

    return null
  }, [currentTrip, selectedDetail])
  const mapPlaces = useMemo(
    () => appState?.nearbySuggestions.map((suggestion) => suggestion.place) ?? appState?.places ?? [],
    [appState],
  )
  const shareUrl = useMemo(() => {
    if (!currentTrip) {
      return ""
    }

    if (typeof window === "undefined") {
      return `/trips/${currentTrip.id}`
    }

    return `${window.location.origin}/trips/${currentTrip.id}`
  }, [currentTrip])

  async function loadAppState(tripId?: string) {
    setIsRefreshing(true)
    setErrorMessage(null)

    try {
      const nextState = await fetchLoopinAppState(tripId)
      setAppState(nextState)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load Loopin")
    } finally {
      setIsRefreshing(false)
    }
  }

  async function applyAction(
    action:
      | Parameters<typeof runLoopinAction>[0],
  ) {
    setIsRefreshing(true)
    setErrorMessage(null)

    try {
      const nextState = await runLoopinAction(action)
      setAppState(nextState)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update Loopin")
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleTripCreate(trip: Trip) {
    await applyAction({
      trip: {
        cityId: trip.destination.id,
        endDate: trip.endDate,
        partySize: trip.partySize,
        preferences: trip.preferences,
        startDate: trip.startDate,
      },
      type: "create-trip",
    })

    setSelectedDayIndex(0)
    setSelectedDetail(null)
    setIsTripWizardOpen(false)
    setActiveTab("trips")
  }

  async function handleStopRemove(dayIndex: number, stopId: string) {
    if (!currentTrip) {
      return
    }

    await applyAction({
      stopId,
      tripId: currentTrip.id,
      type: "remove-stop",
    })
  }

  async function handleStopSwap(dayIndex: number, stopId: string, newPlace: Place) {
    if (!currentTrip) {
      return
    }

    await applyAction({
      newPlaceId: newPlace.id,
      stopId,
      tripId: currentTrip.id,
      type: "swap-stop",
    })
  }

  async function handleAddToTrip(place: Place) {
    if (!currentTrip) {
      return
    }

    await applyAction({
      placeId: place.id,
      targetDay: 1,
      tripId: currentTrip.id,
      type: "add-stop",
    })
    setActiveTab("trips")
  }

  async function handleAddToDay(place: Place) {
    if (!currentTrip || !currentDay) {
      return
    }

    await applyAction({
      placeId: place.id,
      targetDay: currentDay.day,
      tripId: currentTrip.id,
      type: "add-stop",
    })
    setActiveTab("trips")
  }

  async function handleSkipStop(stopId: string) {
    if (!currentTrip) {
      return
    }

    await applyAction({
      stopId,
      tripId: currentTrip.id,
      type: "skip-stop",
    })
  }

  async function handleRegenerateTrip() {
    if (!currentTrip) {
      return
    }

    await applyAction({
      tripId: currentTrip.id,
      type: "regenerate-trip",
    })
    setSelectedDetail(null)
  }

  async function handleSelectTrip(tripId: string) {
    await applyAction({
      tripId,
      type: "set-active-trip",
    })
    setActiveTab("trips")
    setSelectedDetail(null)
    setSelectedDayIndex(0)
  }

  async function handleInviteCollaborator(email: string, role: InviteRole) {
    if (!currentTrip) {
      return
    }

    await applyAction({
      email,
      role,
      tripId: currentTrip.id,
      type: "invite-collaborator",
    })
    setInviteEmail("")
  }

  async function handleTripVisibilityChange(isPublic: boolean) {
    if (!currentTrip) {
      return
    }

    await applyAction({
      isPublic,
      tripId: currentTrip.id,
      type: "update-trip-visibility",
    })
  }

  async function handleConnectTraveler(userId: string) {
    await applyAction({
      targetUserId: userId,
      type: "connect-traveler",
    })
  }

  async function handleCreateIntent(draft: string, category: "activity" | "food" | "general" | "nightlife") {
    if (!draft.trim()) {
      return
    }

    await applyAction({
      category,
      description: draft.trim(),
      type: "create-intent",
    })
    setIntentDraft("")
  }

  async function handleVisibilityChange(visibility: VisibilitySettings) {
    await applyAction({
      profile: {
        visibility,
      },
      type: "update-profile",
    })
  }

  async function handleEditProfile() {
    if (!currentUser || typeof window === "undefined") {
      return
    }

    const [currentFirstName = "", ...rest] = currentUser.name.split(" ")
    const currentLastName = rest.join(" ")
    const firstName = window.prompt("First name", currentFirstName)

    if (firstName === null) {
      return
    }

    const lastName = window.prompt("Last name", currentLastName)

    if (lastName === null) {
      return
    }

    await applyAction({
      profile: {
        firstName: firstName.trim() || currentFirstName,
        lastName: lastName.trim() || currentLastName,
      },
      type: "update-profile",
    })
  }

  async function handleAddInterest() {
    if (!currentUser) {
      return
    }

    const nextInterest = ALL_INTERESTS.find(
      (interest) => !currentUser.interests.includes(interest),
    )

    if (!nextInterest) {
      return
    }

    await applyAction({
      profile: {
        interests: [...currentUser.interests, nextInterest],
      },
      type: "update-profile",
    })
  }

  function handleMessageTraveler(userId: string) {
    const traveler = appState?.travelers.find((presence) => presence.user.id === userId)?.user

    if (!traveler || typeof window === "undefined") {
      return
    }

    const subject = encodeURIComponent("Loopin trip connection")
    const body = encodeURIComponent(`Hey ${traveler.name}, I saw your trip plans on Loopin.`)
    window.location.href = `mailto:${traveler.email}?subject=${subject}&body=${body}`
  }

  function handlePlaceSelect(place: Place) {
    setSelectedDetail({
      kind: "place",
      place,
    })
  }

  function handleStopSelect(stop: DayStop) {
    setSelectedDetail({
      kind: "stop",
      stopId: stop.id,
    })
  }

  function handleExportOfflineTripCard() {
    if (!currentTrip) {
      return
    }

    const text = [
      `${currentTrip.destination.name}, ${currentTrip.destination.country}`,
      `${currentTrip.startDate} to ${currentTrip.endDate}`,
      "",
      ...currentTrip.days.flatMap((day) => [
        `Day ${day.day} - ${day.date}`,
        ...day.stops.map(
          (stop) =>
            `${stop.startTime} ${stop.place.name} - ${stop.place.neighborhood ?? stop.place.address ?? ""}`,
        ),
        "",
      ]),
    ].join("\n")

    downloadFile(`loopin-${currentTrip.id}-offline.txt`, text, "text/plain")
  }

  function handleExportCalendar() {
    if (!currentTrip) {
      return
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Loopin//Trip Planner//EN",
      ...currentTrip.days.flatMap((day) =>
        day.stops.map((stop) => [
          "BEGIN:VEVENT",
          `UID:${stop.id}@loopin.local`,
          `DTSTAMP:${formatIcsTimestamp(new Date())}`,
          `DTSTART:${formatIcsDate(day.date, stop.startTime)}`,
          `DTEND:${formatIcsDate(day.date, stop.endTime || stop.startTime)}`,
          `SUMMARY:${escapeIcs(stop.place.name)}`,
          `DESCRIPTION:${escapeIcs(stop.place.description)}`,
          "END:VEVENT",
        ].join("\n")),
      ),
      "END:VCALENDAR",
    ].join("\n")

    downloadFile(`loopin-${currentTrip.id}.ics`, lines, "text/calendar")
  }

  function handlePrintItinerary() {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  if (isLoading || (!appState && isRefreshing)) {
    return <LoadingScreen label="Loading your trips..." />
  }

  if (!appState || !currentTrip || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-2xl border bg-card p-6 text-center">
          <p className="font-medium text-foreground">
            {errorMessage ?? "Loopin couldn't load your app state."}
          </p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-primary hover:underline"
            onClick={() => void loadAppState(initialTripId)}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as ActiveTab)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === "trips" ? (
          <TripHeader
            trip={currentTrip}
            currentUser={currentUser}
            onNewTrip={() => setIsTripWizardOpen(true)}
            onShare={() => setIsShareDialogOpen(true)}
            onUserMenuClick={() => setActiveTab("profile")}
          />
        ) : null}

        <div className="flex flex-1 overflow-hidden">
          {activeTab === "trips" ? (
            <>
              <div className="flex w-[600px] flex-col border-r border-border bg-card">
                <ItineraryView
                  trip={currentTrip}
                  selectedStopId={selectedDetail?.kind === "stop" ? selectedDetail.stopId : undefined}
                  onRegenerate={handleRegenerateTrip}
                  onStopRemove={handleStopRemove}
                  onStopSelect={handleStopSelect}
                  onStopSwap={handleStopSwap}
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="h-[50%] border-b border-border p-4">
                  <MapView
                    selectedStopId={selectedStop?.id}
                    showRoute
                    stops={allStops}
                    onStopClick={handleStopSelect}
                  />
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {selectedStop ? (
                    <PlaceDetailPanel
                      stop={selectedStop}
                      onClose={() => setSelectedDetail(null)}
                      onSwap={(newPlace) => {
                        if (selectedDetail?.kind === "stop") {
                          void handleStopSwap(selectedDayIndex, selectedDetail.stopId, newPlace)
                        }
                      }}
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
          ) : null}

          {activeTab === "explore" ? (
            <div className="flex flex-1">
              <div className="w-[500px] border-r border-border">
                <ExploreView
                  city={currentTrip.destination}
                  dishes={appState.dishes}
                  places={appState.places}
                  onAddToTrip={(place) => void handleAddToTrip(place)}
                  onPlaceSelect={handlePlaceSelect}
                />
              </div>
              <div className="flex-1 p-4">
                <MapView
                  places={appState.places}
                  selectedStopId={selectedDetail?.kind === "place" ? selectedDetail.place.id : selectedStop?.place.id}
                  showRoute={false}
                  onPlaceClick={handlePlaceSelect}
                />
              </div>
            </div>
          ) : null}

          {activeTab === "now" ? (
            <div className="flex flex-1">
              <div className="w-[450px] border-r border-border">
                <NowView
                  cityName={currentTrip.destination.name}
                  currentDay={currentDay ?? undefined}
                  currentNeighborhoodLabel={currentDayStops[0]?.place.neighborhood}
                  currentStopIndex={0}
                  quickActions={appState.quickActions}
                  suggestions={appState.nearbySuggestions}
                  onAddToDay={(place) => void handleAddToDay(place)}
                  onPlaceSelect={handlePlaceSelect}
                  onSkipStop={(stopId) => void handleSkipStop(stopId)}
                />
              </div>
              <div className="flex-1 p-4">
                <MapView
                  places={mapPlaces}
                  selectedStopId={selectedStop?.id}
                  showRoute
                  stops={currentDayStops}
                  onPlaceClick={handlePlaceSelect}
                  onStopClick={handleStopSelect}
                />
              </div>
            </div>
          ) : null}

          {activeTab === "social" ? (
            <div className="flex-1">
              <SocialView
                cityName={currentTrip.destination.name}
                connections={appState.connections}
                currentUser={currentUser}
                intentDraft={intentDraft}
                placePresence={appState.placePresence}
                travelers={appState.travelers}
                visibility={currentUser.visibility}
                onConnect={(userId) => void handleConnectTraveler(userId)}
                onIntentDraftChange={setIntentDraft}
                onMessage={handleMessageTraveler}
                onPlacePresenceSelect={(placeId) => handlePlaceSelect(appState.places.find((place) => place.id === placeId) ?? appState.places[0]!)}
                onSubmitIntent={(draft, category) => void handleCreateIntent(draft, category)}
                onVisibilityChange={(visibility) => void handleVisibilityChange(visibility)}
              />
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="flex-1">
              <ProfileView
                user={currentUser}
                trips={appState.trips}
                onAddInterest={() => void handleAddInterest()}
                onCreateTrip={() => setIsTripWizardOpen(true)}
                onEditProfile={() => void handleEditProfile()}
                onLogout={signOut}
                onOpenVisibilitySettings={() => setActiveTab("social")}
                onSelectTrip={(tripId) => void handleSelectTrip(tripId)}
              />
            </div>
          ) : null}
        </div>
      </div>

      <TripWizard
        cities={appState.cities}
        open={isTripWizardOpen}
        onClose={() => setIsTripWizardOpen(false)}
        onComplete={(trip) => void handleTripCreate(trip)}
      />

      <ShareDialog
        collaborators={currentTrip.collaborators}
        currentUserId={currentUser.id}
        inviteEmail={inviteEmail}
        inviteRole={inviteRole}
        isPublic={currentTrip.isPublic}
        open={isShareDialogOpen}
        owner={currentUser}
        shareUrl={shareUrl}
        trip={currentTrip}
        onClose={() => setIsShareDialogOpen(false)}
        onExportCalendar={handleExportCalendar}
        onExportOfflineTripCard={handleExportOfflineTripCard}
        onInvite={(email, role) => void handleInviteCollaborator(email, role)}
        onInviteEmailChange={setInviteEmail}
        onInviteRoleChange={setInviteRole}
        onPrintItinerary={handlePrintItinerary}
        onUpdateVisibility={(isPublic) => void handleTripVisibilityChange(isPublic)}
      />
    </div>
  )
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Compass className="h-9 w-9 text-primary-foreground" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function downloadFile(filename: string, contents: string, mimeType: string) {
  if (typeof window === "undefined") {
    return
  }

  const blob = new Blob([contents], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function escapeIcs(value: string) {
  return value.replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n")
}

function formatIcsTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function formatIcsDate(date: string, time: string) {
  const [hours = "00", minutes = "00"] = time.split(":")
  return `${date.replace(/-/g, "")}T${hours}${minutes}00`
}

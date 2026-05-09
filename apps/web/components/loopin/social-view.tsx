"use client"

import { useEffect, useState } from "react"
import type { ElementType } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { format, parseISO } from "date-fns"
import {
  MapPin,
  Users,
  MessageCircle,
  UserPlus,
  Globe,
  Calendar,
  Coffee,
  PartyPopper,
  Compass,
  Send,
  Settings,
  Info,
  ChevronRight,
  Flag,
} from "lucide-react"
import type { Connection, Place, TravelerPresence, TravelIntent, User, VisibilitySettings } from "@/lib/types"

type SocialTab = "connections" | "intents" | "lobby" | "places"
type IntentCategory = TravelIntent["category"]

type SocialPlacePresence = {
  count: number
  place: Pick<Place, "id" | "image" | "name" | "neighborhood">
  travelers?: Array<Pick<User, "avatar" | "id" | "name">>
}

const DEFAULT_VISIBILITY: VisibilitySettings = {
  allowMessages: true,
  showInCityLobby: true,
  showPlannedPlaces: false,
}

const INTENT_CATEGORY_OPTIONS: Array<{
  icon: ElementType
  id: IntentCategory
  label: string
}> = [
  { id: "food", label: "Food", icon: Coffee },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper },
  { id: "activity", label: "Activity", icon: Compass },
]

const REFERENCE_USERS: User[] = [
  {
    id: "ref-user-1",
    name: "Mika",
    email: "mika@loopin.local",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    countryCode: "DE",
    interests: ["art", "nightlife", "food"],
    visibility: DEFAULT_VISIBILITY,
    createdAt: new Date("2026-05-01"),
  },
  {
    id: "ref-user-2",
    name: "James",
    email: "james@loopin.local",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    countryCode: "GB",
    interests: ["history", "culture", "nature"],
    visibility: DEFAULT_VISIBILITY,
    createdAt: new Date("2026-05-02"),
  },
  {
    id: "ref-user-3",
    name: "Yuki",
    email: "yuki@loopin.local",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    countryCode: "JP",
    interests: ["food", "shopping", "nightlife"],
    visibility: DEFAULT_VISIBILITY,
    createdAt: new Date("2026-05-03"),
  },
]

const REFERENCE_TRAVELERS: TravelerPresence[] = [
  {
    id: "ref-presence-1",
    user: REFERENCE_USERS[0],
    cityId: "tokyo",
    dateRange: { start: "2026-05-18", end: "2026-05-24" },
    plannedPlaces: ["golden-gai", "teamlab-planets"],
    intents: [
      {
        id: "ref-intent-1",
        description: "Looking for someone to explore Golden Gai bars with on Friday night.",
        category: "nightlife",
        date: "2026-05-19",
        maxGroupSize: 4,
        createdAt: new Date("2026-05-10"),
      },
    ],
    visibility: "public",
  },
  {
    id: "ref-presence-2",
    user: REFERENCE_USERS[1],
    cityId: "tokyo",
    dateRange: { start: "2026-05-18", end: "2026-05-22" },
    plannedPlaces: ["meiji-jingu", "shinjuku-gyoen"],
    intents: [
      {
        id: "ref-intent-2",
        description: "Would love to find a local guide for temple visits and quiet gardens.",
        category: "activity",
        createdAt: new Date("2026-05-11"),
      },
    ],
    visibility: "public",
  },
  {
    id: "ref-presence-3",
    user: REFERENCE_USERS[2],
    cityId: "tokyo",
    dateRange: { start: "2026-05-16", end: "2026-05-25" },
    plannedPlaces: ["tsukiji-market", "omoide-yokocho"],
    intents: [
      {
        id: "ref-intent-3",
        description: "Street food crawl in Shibuya anyone?",
        category: "food",
        date: "2026-05-20",
        maxGroupSize: 6,
        createdAt: new Date("2026-05-12"),
      },
    ],
    visibility: "public",
  },
]

const REFERENCE_PLACE_PRESENCE: SocialPlacePresence[] = [
  {
    count: 3,
    place: {
      id: "meiji-jingu",
      image: "https://images.unsplash.com/photo-1583766395091-2eb9994ed094?w=400&q=80",
      name: "Meiji Jingu Shrine",
      neighborhood: "Shibuya",
    },
    travelers: [REFERENCE_USERS[0], REFERENCE_USERS[1]],
  },
  {
    count: 4,
    place: {
      id: "onibus-coffee",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      name: "ONIBUS Coffee Nakameguro",
      neighborhood: "Nakameguro",
    },
    travelers: [REFERENCE_USERS[0], REFERENCE_USERS[2]],
  },
  {
    count: 2,
    place: {
      id: "golden-gai",
      image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80",
      name: "Golden Gai",
      neighborhood: "Shinjuku",
    },
    travelers: [REFERENCE_USERS[1]],
  },
]

interface SocialViewProps {
  cityName?: string
  connections?: Connection[]
  currentUser?: User
  initialTab?: SocialTab
  intentDraft?: string
  lobbyDateLabel?: string
  onBrowseLobby?: () => void
  onConnect?: (userId: string) => void
  onIntentDraftChange?: (draft: string) => void
  onMessage?: (userId: string) => void
  onPlacePresenceSelect?: (placeId: string) => void
  onSubmitIntent?: (draft: string, category: IntentCategory) => void
  onVisibilityChange?: (visibility: VisibilitySettings) => void
  placePresence?: SocialPlacePresence[]
  travelers?: TravelerPresence[]
  visibility?: VisibilitySettings
}

export function SocialView({
  cityName = "Tokyo",
  connections,
  currentUser,
  initialTab = "lobby",
  intentDraft,
  lobbyDateLabel = "May 18-22",
  onBrowseLobby,
  onConnect,
  onIntentDraftChange,
  onMessage,
  onPlacePresenceSelect,
  onSubmitIntent,
  onVisibilityChange,
  placePresence,
  travelers,
  visibility,
}: SocialViewProps) {
  const [activeTab, setActiveTab] = useState<SocialTab>(initialTab)
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false)
  const [activeIntentCategory, setActiveIntentCategory] = useState<IntentCategory>("food")
  const [localIntentDraft, setLocalIntentDraft] = useState("")
  const [localVisibility, setLocalVisibility] = useState<VisibilitySettings>(
    visibility ?? currentUser?.visibility ?? DEFAULT_VISIBILITY
  )

  const travelersInCity = travelers ?? REFERENCE_TRAVELERS
  const resolvedConnections = connections ?? []
  const resolvedIntentDraft = intentDraft ?? localIntentDraft
  const resolvedVisibility = visibility ?? localVisibility
  const resolvedPlacePresence = placePresence ?? REFERENCE_PLACE_PRESENCE

  useEffect(() => {
    if (visibility) {
      setLocalVisibility(visibility)
      return
    }

    if (currentUser?.visibility) {
      setLocalVisibility(currentUser.visibility)
    }
  }, [
    currentUser?.visibility?.allowMessages,
    currentUser?.visibility?.showInCityLobby,
    currentUser?.visibility?.showPlannedPlaces,
    visibility,
  ])

  function setIntentDraftValue(value: string) {
    onIntentDraftChange?.(value)

    if (intentDraft === undefined) {
      setLocalIntentDraft(value)
    }
  }

  function setVisibilityValue(nextVisibility: VisibilitySettings) {
    if (visibility === undefined) {
      setLocalVisibility(nextVisibility)
    }

    onVisibilityChange?.(nextVisibility)
  }

  function handleIntentSubmit() {
    const normalizedDraft = resolvedIntentDraft.trim()
    if (!normalizedDraft) {
      return
    }

    onSubmitIntent?.(normalizedDraft, activeIntentCategory)
    setIntentDraftValue("")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Social</h1>
            <p className="text-sm text-muted-foreground">
              Connect with travelers in {cityName}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVisibilitySettings(!showVisibilitySettings)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Visibility
          </Button>
        </div>

        {showVisibilitySettings ? (
          <div className="mt-4 rounded-xl border bg-muted/30 p-4">
            <div className="mb-4 flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Control what other travelers can see about you. Your safety and privacy come first.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Show in city lobby</p>
                    <p className="text-xs text-muted-foreground">
                      Others can see you&apos;re visiting this city
                    </p>
                  </div>
                </div>
                <Switch
                  checked={resolvedVisibility.showInCityLobby}
                  onCheckedChange={(checked) =>
                    setVisibilityValue({ ...resolvedVisibility, showInCityLobby: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Show planned places</p>
                    <p className="text-xs text-muted-foreground">
                      Others can see specific places you plan to visit
                    </p>
                  </div>
                </div>
                <Switch
                  checked={resolvedVisibility.showPlannedPlaces}
                  onCheckedChange={(checked) =>
                    setVisibilityValue({ ...resolvedVisibility, showPlannedPlaces: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Allow messages</p>
                    <p className="text-xs text-muted-foreground">
                      Other travelers can send you direct messages
                    </p>
                  </div>
                </div>
                <Switch
                  checked={resolvedVisibility.allowMessages}
                  onCheckedChange={(checked) =>
                    setVisibilityValue({ ...resolvedVisibility, allowMessages: checked })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SocialTab)} className="flex flex-1 flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="lobby" className="data-[state=active]:bg-transparent">
            City Lobby
          </TabsTrigger>
          <TabsTrigger value="places" className="data-[state=active]:bg-transparent">
            At Places
          </TabsTrigger>
          <TabsTrigger value="intents" className="data-[state=active]:bg-transparent">
            Looking for
          </TabsTrigger>
          <TabsTrigger value="connections" className="data-[state=active]:bg-transparent">
            Connections
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="lobby" className="mt-0 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {travelersInCity.length} travelers in {cityName}
                </span>
              </div>
              <Badge variant="outline">{lobbyDateLabel}</Badge>
            </div>

            <div className="space-y-4">
              {travelersInCity.map((presence) => (
                <TravelerCard
                  key={presence.id}
                  presence={presence}
                  onConnect={() => onConnect?.(presence.user.id)}
                  onMessage={() => onMessage?.(presence.user.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="places" className="mt-0 p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              See who else is planning to visit the same places
            </p>
            <div className="space-y-3">
              {resolvedPlacePresence.map(({ count, place, travelers: attendees }) => (
                <button
                  key={place.id}
                  type="button"
                  className="flex w-full items-center gap-4 rounded-xl border bg-card p-3 text-left"
                  onClick={() => onPlacePresenceSelect?.(place.id)}
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={place.image}
                      alt={place.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{place.name}</p>
                    <p className="text-sm text-muted-foreground">{place.neighborhood}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {(attendees ?? []).slice(0, 3).map((traveler) => (
                        <Avatar key={traveler.id} className="h-7 w-7 border-2 border-card">
                          <AvatarImage src={traveler.avatar} />
                          <AvatarFallback>{traveler.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {count} {count === 1 ? "person" : "people"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="intents" className="mt-0 p-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Post what you&apos;re looking for or browse others&apos; intents
              </p>
            </div>

            <div className="mb-6 rounded-xl border bg-card p-4">
              <Textarea
                placeholder="What are you looking for? (e.g., 'Looking for someone to explore Golden Gai bars with on Friday night')"
                className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                value={resolvedIntentDraft}
                onChange={(event) => setIntentDraftValue(event.target.value)}
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {INTENT_CATEGORY_OPTIONS.map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.id}
                        variant={activeIntentCategory === option.id ? "default" : "outline"}
                        size="sm"
                        className="gap-1"
                        onClick={() => setActiveIntentCategory(option.id)}
                      >
                        <Icon className="h-3 w-3" />
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={handleIntentSubmit}
                  disabled={!resolvedIntentDraft.trim()}
                >
                  <Send className="h-3 w-3" />
                  Post
                </Button>
              </div>
            </div>

            <h3 className="mb-3 font-semibold">Recent intents</h3>
            <div className="space-y-4">
              {travelersInCity
                .flatMap((presence) => presence.intents.map((intent) => ({ intent, user: presence.user })))
                .map(({ intent, user }) => (
                  <IntentCard
                    key={intent.id}
                    intent={intent}
                    user={user}
                    onConnect={() => onConnect?.(user.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="connections" className="mt-0 p-4">
            {resolvedConnections.length > 0 ? (
              <div className="space-y-3">
                {resolvedConnections.map((connection) => {
                  const counterpartId = connection.users.find((id) => id !== currentUser?.id) ?? connection.users[0]
                  const counterpartUser = travelersInCity.find((traveler) => traveler.user.id === counterpartId)?.user

                  if (!counterpartUser) {
                    return null
                  }

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between rounded-xl border bg-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={counterpartUser.avatar} />
                          <AvatarFallback>{counterpartUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{counterpartUser.name}</p>
                          <p className="text-sm text-muted-foreground">{counterpartUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {connection.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => onMessage?.(counterpartUser.id)}>
                          Message
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">No connections yet</h3>
                <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">
                  Connect with travelers in the city lobby to start chatting and planning together.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setActiveTab("lobby")
                    onBrowseLobby?.()
                  }}
                >
                  Browse city lobby
                </Button>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

interface TravelerCardProps {
  onConnect?: () => void
  onMessage?: () => void
  presence: TravelerPresence
}

function TravelerCard({ onConnect, onMessage, presence }: TravelerCardProps) {
  const { dateRange, intents, user } = presence
  const startDate = parseISO(dateRange.start)
  const endDate = parseISO(dateRange.end)

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{user.name}</span>
            {user.countryCode ? (
              <Flag className="h-4 w-4 text-muted-foreground" />
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {user.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs capitalize">
                {interest}
              </Badge>
            ))}
          </div>

          {intents.length > 0 ? (
            <div className="mt-3 rounded-lg bg-muted/50 p-2">
              <p className="text-sm italic text-muted-foreground">
                &quot;{intents[0].description}&quot;
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={onConnect} className="gap-1">
            <UserPlus className="h-4 w-4" />
            Connect
          </Button>
          {presence.visibility === "public" && user.visibility.allowMessages ? (
            <Button variant="outline" size="sm" onClick={onMessage} className="gap-1">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

interface IntentCardProps {
  intent: TravelIntent
  onConnect?: () => void
  user: User
}

function IntentCard({ intent, onConnect, user }: IntentCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {intent.category}
            </Badge>
            {intent.date ? (
              <span className="text-xs text-muted-foreground">
                {format(parseISO(intent.date), "EEE, MMM d")}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{intent.description}</p>
          {intent.maxGroupSize ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Looking for up to {intent.maxGroupSize} people
            </p>
          ) : null}
        </div>
        <Button size="sm" variant="outline" onClick={onConnect}>
          Join
        </Button>
      </div>
    </div>
  )
}

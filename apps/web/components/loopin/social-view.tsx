"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  MapPin,
  Users,
  MessageCircle,
  UserPlus,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Calendar,
  Coffee,
  PartyPopper,
  Compass,
  Heart,
  Send,
  Settings,
  Info,
  ChevronRight,
  Flag,
} from "lucide-react"
import type { TravelerPresence, User, TravelIntent } from "@/lib/types"
import { tokyoTravelers, sampleUsers, cities, places } from "@/lib/sample-data"

interface SocialViewProps {
  currentUser?: User
  onConnect?: (userId: string) => void
  onMessage?: (userId: string) => void
}

export function SocialView({ currentUser, onConnect, onMessage }: SocialViewProps) {
  const [activeTab, setActiveTab] = useState("lobby")
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false)
  const [visibility, setVisibility] = useState({
    showInCityLobby: true,
    showPlannedPlaces: false,
    allowMessages: true,
  })

  const currentCity = cities[0]
  const travelersInCity = tokyoTravelers

  // Count travelers at specific places
  const placePresence = places.slice(0, 5).map((place) => ({
    place,
    count: Math.floor(Math.random() * 5) + 1,
  }))

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Social</h1>
            <p className="text-sm text-muted-foreground">
              Connect with travelers in {currentCity.name}
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

        {/* Visibility settings */}
        {showVisibilitySettings && (
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
                  checked={visibility.showInCityLobby}
                  onCheckedChange={(checked) =>
                    setVisibility((v) => ({ ...v, showInCityLobby: checked }))
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
                  checked={visibility.showPlannedPlaces}
                  onCheckedChange={(checked) =>
                    setVisibility((v) => ({ ...v, showPlannedPlaces: checked }))
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
                  checked={visibility.allowMessages}
                  onCheckedChange={(checked) =>
                    setVisibility((v) => ({ ...v, allowMessages: checked }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
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
          {/* City Lobby Tab */}
          <TabsContent value="lobby" className="mt-0 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {travelersInCity.length} travelers in {currentCity.name}
                </span>
              </div>
              <Badge variant="outline">May 18-22</Badge>
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

          {/* At Places Tab */}
          <TabsContent value="places" className="mt-0 p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              See who else is planning to visit the same places
            </p>
            <div className="space-y-3">
              {placePresence.map(({ place, count }) => (
                <div
                  key={place.id}
                  className="flex items-center gap-4 rounded-xl border bg-card p-3"
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
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <Avatar key={i} className="h-7 w-7 border-2 border-card">
                          <AvatarImage
                            src={sampleUsers[i]?.avatar}
                          />
                          <AvatarFallback>
                            {sampleUsers[i]?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {count} {count === 1 ? "person" : "people"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Intents Tab */}
          <TabsContent value="intents" className="mt-0 p-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Post what you&apos;re looking for or browse others&apos; intents
              </p>
            </div>

            {/* Post intent form */}
            <div className="mb-6 rounded-xl border bg-card p-4">
              <Textarea
                placeholder="What are you looking for? (e.g., 'Looking for someone to explore Golden Gai bars with on Friday night')"
                className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Coffee className="h-3 w-3" />
                    Food
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <PartyPopper className="h-3 w-3" />
                    Nightlife
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Compass className="h-3 w-3" />
                    Activity
                  </Button>
                </div>
                <Button size="sm" className="gap-1">
                  <Send className="h-3 w-3" />
                  Post
                </Button>
              </div>
            </div>

            {/* Existing intents */}
            <h3 className="mb-3 font-semibold">Recent intents</h3>
            <div className="space-y-4">
              {travelersInCity
                .flatMap((p) =>
                  p.intents.map((intent) => ({ intent, user: p.user }))
                )
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

          {/* Connections Tab */}
          <TabsContent value="connections" className="mt-0 p-4">
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
                onClick={() => setActiveTab("lobby")}
              >
                Browse city lobby
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

// ============ Sub-components ============

interface TravelerCardProps {
  presence: TravelerPresence
  onConnect?: () => void
  onMessage?: () => void
}

function TravelerCard({ presence, onConnect, onMessage }: TravelerCardProps) {
  const { user, dateRange, plannedPlaces, intents } = presence
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
            {user.countryCode && (
              <Flag className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(startDate, "MMM d")} – {format(endDate, "MMM d")}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {user.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs capitalize">
                {interest}
              </Badge>
            ))}
          </div>

          {intents.length > 0 && (
            <div className="mt-3 rounded-lg bg-muted/50 p-2">
              <p className="text-sm italic text-muted-foreground">
                &quot;{intents[0].description}&quot;
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={onConnect} className="gap-1">
            <UserPlus className="h-4 w-4" />
            Connect
          </Button>
          {presence.visibility === "public" && user.visibility.allowMessages && (
            <Button variant="outline" size="sm" onClick={onMessage} className="gap-1">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface IntentCardProps {
  intent: TravelIntent
  user: User
  onConnect?: () => void
}

function IntentCard({ intent, user, onConnect }: IntentCardProps) {
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
            {intent.date && (
              <span className="text-xs text-muted-foreground">
                {format(parseISO(intent.date), "EEE, MMM d")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{intent.description}</p>
          {intent.maxGroupSize && (
            <p className="mt-2 text-xs text-muted-foreground">
              Looking for up to {intent.maxGroupSize} people
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={onConnect}>
          Join
        </Button>
      </div>
    </div>
  )
}

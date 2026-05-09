"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  Edit2,
  MapPin,
  Calendar,
  Globe,
  Bell,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Plus,
} from "lucide-react"
import type { InterestType, Trip, User } from "@/lib/types"
import { useTheme } from "next-themes"

interface ProfileViewProps {
  user: User
  darkModeEnabled?: boolean
  gemsFoundCount?: number
  notificationsEnabled?: boolean
  onAddInterest?: () => void
  onCreateTrip?: () => void
  onDarkModeChange?: (enabled: boolean) => void
  onEditProfile?: () => void
  onNotificationsChange?: (enabled: boolean) => void
  onOpenHelpSupport?: () => void
  onOpenVisibilitySettings?: () => void
  onLogout?: () => void
  onSelectTrip?: (tripId: string) => void
  trips?: Trip[]
}

const INTEREST_COLORS: Record<InterestType, string> = {
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  culture: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  nightlife: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  nature: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  shopping: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "work-friendly": "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  art: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  history: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400",
  photography: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
}

export function ProfileView({
  user,
  darkModeEnabled,
  gemsFoundCount,
  notificationsEnabled,
  onAddInterest,
  onCreateTrip,
  onDarkModeChange,
  onEditProfile,
  onNotificationsChange,
  onOpenHelpSupport,
  onOpenVisibilitySettings,
  onLogout,
  onSelectTrip,
  trips = [],
}: ProfileViewProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  const pastTrips = trips.filter((trip) => trip.status === "completed")
  const upcomingTrips = trips.filter((trip) => trip.status !== "completed")
  const resolvedDarkMode = darkModeEnabled ?? resolvedTheme === "dark"
  const resolvedNotifications = notificationsEnabled ?? notifications
  const resolvedGemsFoundCount = gemsFoundCount
    ?? trips.flatMap((trip) => trip.days.flatMap((day) => day.stops))
      .filter((stop) => stop.place.hiddenness === "hidden").length

  function handleNotificationChange(nextValue: boolean) {
    if (notificationsEnabled === undefined) {
      setNotifications(nextValue)
    }

    onNotificationsChange?.(nextValue)
  }

  function handleDarkModeChange(nextValue: boolean) {
    if (darkModeEnabled === undefined) {
      setTheme(nextValue ? "dark" : "light")
    }

    onDarkModeChange?.(nextValue)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative h-32 bg-gradient-to-br from-primary/80 to-primary">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10"
          onClick={onEditProfile}
        >
          <Edit2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative px-6 pb-4">
        <Avatar className="-mt-12 h-24 w-24 border-4 border-background">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="mt-3">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {user.interests.map((interest) => (
            <Badge
              key={interest}
              className={cn(
                "capitalize border-0",
                INTEREST_COLORS[interest] ?? "bg-muted text-muted-foreground"
              )}
            >
              {interest}
            </Badge>
          ))}
          <Button variant="outline" size="sm" className="h-6 gap-1 px-2" onClick={onAddInterest}>
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>

        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="font-semibold">{trips.length}</span>
            <span className="ml-1 text-muted-foreground">trips</span>
          </div>
          <div>
            <span className="font-semibold">{pastTrips.length}</span>
            <span className="ml-1 text-muted-foreground">completed</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold">{resolvedGemsFoundCount}</span>
            <span className="ml-1 text-muted-foreground">gems found</span>
          </div>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          <div>
            <h2 className="mb-3 font-semibold">Upcoming Trips</h2>
            {upcomingTrips.length > 0 ? (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onClick={onSelectTrip} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No trips planned yet
                </p>
                <Button className="mt-3" size="sm" onClick={onCreateTrip}>
                  Plan a trip
                </Button>
              </div>
            )}
          </div>

          {pastTrips.length > 0 ? (
            <div>
              <h2 className="mb-3 font-semibold">Past Trips</h2>
              <div className="space-y-3">
                {pastTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} isPast onClick={onSelectTrip} />
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="mb-3 font-semibold">Settings</h2>
            <div className="space-y-1">
              <SettingsRow
                icon={<Globe className="h-4 w-4" />}
                label="Visibility settings"
                hasChevron
                onClick={onOpenVisibilitySettings}
              />
              <SettingsRow
                icon={<Bell className="h-4 w-4" />}
                label="Notifications"
                action={
                  <Switch
                    checked={resolvedNotifications}
                    onCheckedChange={handleNotificationChange}
                  />
                }
              />
              <SettingsRow
                icon={<Moon className="h-4 w-4" />}
                label="Dark mode"
                action={
                  <Switch
                    checked={resolvedDarkMode}
                    onCheckedChange={handleDarkModeChange}
                  />
                }
              />
              <SettingsRow
                icon={<HelpCircle className="h-4 w-4" />}
                label="Help & Support"
                hasChevron
                onClick={onOpenHelpSupport}
              />
              <SettingsRow
                icon={<LogOut className="h-4 w-4" />}
                label="Log out"
                onClick={onLogout}
                destructive
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

interface TripCardProps {
  trip: Trip
  isPast?: boolean
  onClick?: (tripId: string) => void
}

function TripCard({ trip, isPast, onClick }: TripCardProps) {
  const startDate = parseISO(trip.startDate)
  const endDate = parseISO(trip.endDate)
  const className = cn(
    "flex w-full gap-4 rounded-xl border bg-card p-3 text-left transition-shadow hover:shadow-md",
    isPast && "opacity-70"
  )
  const content = (
    <>
      <div className="relative h-16 w-16 min-h-16 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={trip.destination.image}
          alt={trip.destination.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">
          {trip.destination.name}, {trip.destination.country}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {trip.days.length} days
          </Badge>
          <Badge variant="outline" className="text-xs">
            {trip.partySize} travelers
          </Badge>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 flex-shrink-0 self-center text-muted-foreground" />
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={className} onClick={() => onClick(trip.id)}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

interface SettingsRowProps {
  action?: ReactNode
  destructive?: boolean
  hasChevron?: boolean
  icon: ReactNode
  label: string
  onClick?: () => void
}

function SettingsRow({
  action,
  destructive,
  hasChevron,
  icon,
  label,
  onClick,
}: SettingsRowProps) {
  const baseClassName = cn(
    "flex w-full items-center justify-between rounded-lg px-3 py-3 transition-colors",
    !action && "cursor-pointer hover:bg-muted/50",
    destructive && "text-destructive"
  )

  const content = (
    <>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {action}
      {hasChevron ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
    </>
  )

  if (action) {
    return <div className={baseClassName}>{content}</div>
  }

  return (
    <button onClick={onClick} className={baseClassName}>
      {content}
    </button>
  )
}

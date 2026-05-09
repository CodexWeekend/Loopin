"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, differenceInDays } from "date-fns"
import {
  CalendarDays,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Zap,
  Coffee,
  Palette,
  TreePine,
  ShoppingBag,
  PartyPopper,
  Briefcase,
  Camera,
  Building,
  Check,
} from "lucide-react"
import type { InterestType, BudgetLevel, TravelPace, HiddenGemPreference, City, Trip, TripPreferences } from "@/lib/types"
import { cities } from "@/lib/sample-data"

interface TripWizardProps {
  open: boolean
  onClose: () => void
  onComplete: (trip: Trip) => void
  cities?: City[]
  today?: Date
}

const STEPS = [
  { id: "destination", title: "Where to?", subtitle: "Choose your destination city" },
  { id: "dates", title: "When?", subtitle: "Select your travel dates" },
  { id: "party", title: "Who's going?", subtitle: "Tell us about your group" },
  { id: "budget", title: "Budget", subtitle: "What's your spending style?" },
  { id: "interests", title: "Interests", subtitle: "What do you love to do?" },
  { id: "pace", title: "Travel pace", subtitle: "How do you like to explore?" },
  { id: "hiddenGems", title: "Discovery style", subtitle: "Tourist spots or hidden gems?" },
]

const INTERESTS: { id: InterestType; label: string; icon: React.ElementType }[] = [
  { id: "food", label: "Food & Drink", icon: Coffee },
  { id: "culture", label: "Culture", icon: Building },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper },
  { id: "nature", label: "Nature", icon: TreePine },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "art", label: "Art & Design", icon: Palette },
  { id: "history", label: "History", icon: Building },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "work-friendly", label: "Work-friendly", icon: Briefcase },
]

const BUDGETS: { id: BudgetLevel; label: string; description: string; daily: string }[] = [
  { id: "low", label: "Budget", description: "Hostels, street food, public transit", daily: "$30-60/day" },
  { id: "mid", label: "Mid-range", description: "Hotels, nice restaurants, mix of transit", daily: "$80-150/day" },
  { id: "high", label: "Luxury", description: "Premium stays, fine dining, taxis", daily: "$200+/day" },
]

const PACES: { id: TravelPace; label: string; description: string; icon: string }[] = [
  { id: "relaxed", label: "Relaxed", description: "2-3 activities per day, plenty of free time", icon: "🧘" },
  { id: "balanced", label: "Balanced", description: "4-5 activities, good mix of plans and downtime", icon: "⚖️" },
  { id: "packed", label: "Packed", description: "6+ activities, see as much as possible", icon: "🏃" },
]

const HIDDEN_GEM_PREFS: { id: HiddenGemPreference; label: string; description: string }[] = [
  { id: "touristy", label: "Top attractions", description: "I want to see the famous spots" },
  { id: "mixed", label: "Best of both", description: "Mix of must-sees and local favorites" },
  { id: "local", label: "Hidden gems", description: "Take me where the locals go" },
]

export function TripWizard({
  open,
  onClose,
  onComplete,
  cities: providedCities,
  today = new Date(),
}: TripWizardProps) {
  const [step, setStep] = useState(0)
  const availableCities = providedCities ?? cities
  
  // Form state
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [partySize, setPartySize] = useState(2)
  const [budget, setBudget] = useState<BudgetLevel>("mid")
  const [interests, setInterests] = useState<InterestType[]>([])
  const [pace, setPace] = useState<TravelPace>("balanced")
  const [hiddenGemPref, setHiddenGemPref] = useState<HiddenGemPreference>("mixed")

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1
  const canProceed = () => {
    switch (currentStep.id) {
      case "destination":
        return selectedCity !== null
      case "dates":
        return dateRange.from && dateRange.to
      case "interests":
        return interests.length > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const handleBack = () => {
    setStep(s => Math.max(0, s - 1))
  }

  const handleComplete = () => {
    if (!selectedCity || !dateRange.from || !dateRange.to) return

    const preferences: TripPreferences = {
      budget,
      pace,
      hiddenGemPreference: hiddenGemPref,
      interests,
    }

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      destination: selectedCity,
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
      partySize,
      preferences,
      days: [],
      collaborators: [],
      isPublic: false,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    onComplete(newTrip)
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setStep(0)
    setSelectedCity(null)
    setDateRange({ from: undefined, to: undefined })
    setPartySize(2)
    setBudget("mid")
    setInterests([])
    setPace("balanced")
    setHiddenGemPref("mixed")
  }

  const toggleInterest = (interest: InterestType) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-6">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <DialogHeader className="px-6 pb-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length}</span>
          </div>
          <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
          <p className="text-muted-foreground">{currentStep.subtitle}</p>
        </DialogHeader>

        {/* Content */}
        <div className="min-h-[320px] px-6">
          {/* Step: Destination */}
          {currentStep.id === "destination" && (
            <div className="grid grid-cols-2 gap-3">
              {availableCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city)}
                  className={cn(
                    "relative flex items-end overflow-hidden rounded-xl border-2 transition-all",
                    selectedCity?.id === city.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/20"
                  )}
                >
                  <div className="relative h-32 w-full">
                    <Image
                      src={city.image}
                      alt={city.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 text-left">
                      <p className="font-semibold text-white">{city.name}</p>
                      <p className="text-sm text-white/80">{city.country}</p>
                    </div>
                    {selectedCity?.id === city.id && (
                      <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {/* Add more cities placeholder */}
              <button className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50">
                <div className="flex flex-col items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm">More cities coming soon</span>
                </div>
              </button>
            </div>
          )}

          {/* Step: Dates */}
          {currentStep.id === "dates" && (
            <div className="flex flex-col items-center gap-4">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                disabled={{ before: today }}
                className="rounded-xl border"
              />
              {dateRange.from && dateRange.to && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                  </span>
                  <Badge variant="secondary">
                    {differenceInDays(dateRange.to, dateRange.from) + 1} days
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Step: Party size */}
          {currentStep.id === "party" && (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPartySize(s => Math.max(1, s - 1))}
                  disabled={partySize <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex min-w-[120px] flex-col items-center">
                  <span className="text-5xl font-bold text-primary">{partySize}</span>
                  <span className="text-muted-foreground">
                    {partySize === 1 ? "traveler" : "travelers"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPartySize(s => Math.min(10, s + 1))}
                  disabled={partySize >= 10}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Button
                    key={n}
                    variant={partySize === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPartySize(n)}
                  >
                    {n === 1 ? "Solo" : n === 2 ? "Couple" : `${n} people`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Budget */}
          {currentStep.id === "budget" && (
            <div className="space-y-3">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBudget(b.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    budget === b.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                  )}
                >
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    budget === b.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {b.id === "low" && "$"}
                    {b.id === "mid" && "$$"}
                    {b.id === "high" && "$$$"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{b.label}</p>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                  </div>
                  <Badge variant="secondary">{b.daily}</Badge>
                </button>
              ))}
            </div>
          )}

          {/* Step: Interests */}
          {currentStep.id === "interests" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => {
                  const Icon = interest.icon
                  const isSelected = interests.includes(interest.id)
                  return (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted bg-muted/50 hover:border-muted-foreground/30"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {interest.label}
                    </button>
                  )
                })}
              </div>
              {interests.length > 0 && (
                <p className="text-sm text-primary">
                  {interests.length} interest{interests.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* Step: Pace */}
          {currentStep.id === "pace" && (
            <div className="space-y-3">
              {PACES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPace(p.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    pace === p.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
                    {p.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{p.label}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step: Hidden gems preference */}
          {currentStep.id === "hiddenGems" && (
            <div className="space-y-3">
              {HIDDEN_GEM_PREFS.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => setHiddenGemPref(pref.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    hiddenGemPref === pref.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                  )}
                >
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    hiddenGemPref === pref.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {pref.id === "touristy" && <Building className="h-5 w-5" />}
                    {pref.id === "mixed" && <Zap className="h-5 w-5" />}
                    {pref.id === "local" && <Sparkles className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold">{pref.label}</p>
                    <p className="text-sm text-muted-foreground">{pref.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-4">
          <Button
            variant="ghost"
            onClick={step === 0 ? onClose : handleBack}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            {isLastStep ? (
              <>
                <Sparkles className="h-4 w-4" />
                Create trip
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

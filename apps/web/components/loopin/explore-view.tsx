"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Search,
  MapPin,
  Sparkles,
  TrendingUp,
  Coffee,
  Building,
  TreePine,
  ShoppingBag,
  Star,
  Clock,
  DollarSign,
  Plus,
  Heart,
  Filter,
  ChevronRight,
} from "lucide-react"
import type { City, Place, Neighborhood, PlaceCategory } from "@/lib/types"
import { cities, places, tokyoDishes } from "@/lib/sample-data"

interface ExploreViewProps {
  city?: City
  onPlaceSelect?: (place: Place) => void
  onAddToTrip?: (place: Place) => void
}

const CATEGORIES: { id: PlaceCategory | "all"; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: MapPin },
  { id: "restaurant", label: "Food", icon: Coffee },
  { id: "temple", label: "Culture", icon: Building },
  { id: "park", label: "Nature", icon: TreePine },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
]

export function ExploreView({ city, onPlaceSelect, onAddToTrip }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | "all">("all")
  const [showHiddenOnly, setShowHiddenOnly] = useState(false)

  const currentCity = city || cities[0]
  
  const filteredPlaces = places.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || place.category === activeCategory
    const matchesHidden = !showHiddenOnly || place.hiddenness === "hidden"
    return matchesSearch && matchesCategory && matchesHidden
  })

  const hiddenGems = places.filter(p => p.hiddenness === "hidden")
  const mustSee = places.filter(p => p.popularityScore > 80)

  return (
    <div className="flex h-full flex-col">
      {/* City Header */}
      <div className="relative h-48 w-full min-h-48 overflow-hidden">
        <Image
          src={currentCity.image}
          alt={currentCity.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-3xl font-bold text-white">{currentCity.name}</h1>
          <p className="mt-1 text-white/80">{currentCity.country}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {currentCity.highlights.slice(0, 3).map((h) => (
              <Badge key={h} variant="secondary" className="bg-white/20 text-white backdrop-blur">
                {h}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search places, neighborhoods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="flex-shrink-0 gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </Button>
            )
          })}
          <Button
            variant={showHiddenOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHiddenOnly(!showHiddenOnly)}
            className="flex-shrink-0 gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Hidden gems
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="places" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="places" className="data-[state=active]:bg-transparent">
              Places
            </TabsTrigger>
            <TabsTrigger value="neighborhoods" className="data-[state=active]:bg-transparent">
              Neighborhoods
            </TabsTrigger>
            <TabsTrigger value="food" className="data-[state=active]:bg-transparent">
              What to eat
            </TabsTrigger>
          </TabsList>

          {/* Places Tab */}
          <TabsContent value="places" className="mt-0 p-4">
            {/* Hidden gems highlight */}
            {!showHiddenOnly && hiddenGems.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Hidden Gems</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowHiddenOnly(true)}>
                    See all
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {hiddenGems.slice(0, 4).map((place) => (
                    <HiddenGemCard
                      key={place.id}
                      place={place}
                      onClick={() => onPlaceSelect?.(place)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Must see */}
            {!showHiddenOnly && activeCategory === "all" && (
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Must See</h3>
                </div>
                <div className="space-y-3">
                  {mustSee.slice(0, 3).map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onClick={() => onPlaceSelect?.(place)}
                      onAdd={() => onAddToTrip?.(place)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All places / filtered */}
            <div>
              <h3 className="mb-3 font-semibold">
                {showHiddenOnly ? "Hidden Gems" : activeCategory === "all" ? "All Places" : "Results"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredPlaces.length})
                </span>
              </h3>
              <div className="space-y-3">
                {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onClick={() => onPlaceSelect?.(place)}
                    onAdd={() => onAddToTrip?.(place)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Neighborhoods Tab */}
          <TabsContent value="neighborhoods" className="mt-0 p-4">
            <div className="grid gap-4">
              {currentCity.neighborhoods.map((neighborhood) => (
                <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
              ))}
            </div>
          </TabsContent>

          {/* Food Tab */}
          <TabsContent value="food" className="mt-0 p-4">
            <div className="mb-4">
              <h3 className="mb-1 font-semibold">Must-Try in {currentCity.name}</h3>
              <p className="text-sm text-muted-foreground">
                Don&apos;t leave without trying these local favorites
              </p>
            </div>
            <div className="space-y-4">
              {tokyoDishes.map((dish) => (
                <div key={dish.id} className="flex gap-4 rounded-xl border bg-card p-4">
                  {dish.image && (
                    <div className="relative h-20 w-20 min-h-20 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={dish.image}
                        alt={dish.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{dish.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{dish.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <Badge variant="outline">{dish.category}</Badge>
                      <span className="text-muted-foreground">{dish.priceRange}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}

// ============ Sub-components ============

function HiddenGemCard({ place, onClick }: { place: Place; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-40 flex-shrink-0 overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative h-24 w-full min-h-24">
        <Image src={place.image} alt={place.name} fill className="object-cover" sizes="160px" />
        <Badge className="absolute left-2 top-2 gap-1 bg-primary text-primary-foreground">
          <Sparkles className="h-3 w-3" />
          Hidden gem
        </Badge>
      </div>
      <div className="p-3 text-left">
        <h4 className="truncate font-medium">{place.name}</h4>
        <p className="mt-1 truncate text-xs text-muted-foreground">{place.neighborhood}</p>
      </div>
    </button>
  )
}

function PlaceCard({
  place,
  onClick,
  onAdd,
}: {
  place: Place
  onClick?: () => void
  onAdd?: () => void
}) {
  return (
    <div
      className="flex cursor-pointer gap-4 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative h-20 w-20 min-h-20 flex-shrink-0 overflow-hidden rounded-lg">
        <Image src={place.image} alt={place.name} fill className="object-cover" sizes="80px" />
        {place.hiddenness === "hidden" && (
          <div className="absolute left-1 top-1">
            <Sparkles className="h-4 w-4 text-primary drop-shadow-lg" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium">{place.name}</h4>
            <p className="mt-0.5 text-sm text-muted-foreground">{place.neighborhood}</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
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
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{place.description}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {place.typicalDuration} min
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {place.estimatedCost === 0 ? "Free" : `$${place.estimatedCost}`}
          </div>
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              {place.rating}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NeighborhoodCard({ neighborhood }: { neighborhood: Neighborhood }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-semibold">{neighborhood.name}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{neighborhood.description}</p>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: neighborhood.priceLevel }).map((_, i) => (
              <DollarSign key={i} className="h-3 w-3 text-muted-foreground" />
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground">Best for:</span>
          {neighborhood.bestFor.map((b) => (
            <Badge key={b} variant="secondary" className="text-xs">
              {b}
            </Badge>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {neighborhood.vibes.map((v) => (
            <span key={v} className="text-xs text-muted-foreground">
              #{v}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

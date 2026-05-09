// @ts-nocheck
"use client"

import Image from "next/image"
import { Place } from "@/lib/trip-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Sparkles, Clock, Info } from "lucide-react"

interface PlaceDetailProps {
  place: Place
  onClose: () => void
  swapSuggestion?: {
    original: string
    suggested: {
      name: string
      description: string
      image: string
      extraTime: string
      savings: string
    }
  }
}

export function PlaceDetail({ place, onClose, swapSuggestion }: PlaceDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Place card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="relative">
          {place.isHiddenGem && (
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
          <div className="relative h-32 w-full overflow-hidden rounded-t-xl">
            <Image
              src={place.image}
              alt={place.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground">{place.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Shibuya, Tokyo
          </p>
          <p className="mt-3 text-sm text-foreground">
            {place.description}. A spiritual start to the day.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {place.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-full"
              >
                {tag}
              </Badge>
            ))}
            {!place.tags?.length && (
              <>
                <Badge variant="outline" className="rounded-full">
                  Culture
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Nature
                </Badge>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{place.openHours || "Open 6:00 – 18:00"}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {place.cost === 0 ? "Free" : `$${place.cost}`}
            </span>
          </div>
        </div>
      </div>

      {/* Smart swap suggestion */}
      {swapSuggestion && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                Smart swap suggestion
              </span>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={swapSuggestion.suggested.image}
                  alt={swapSuggestion.suggested.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Swap{" "}
                  <span className="font-semibold">
                    {swapSuggestion.original}
                  </span>{" "}
                  with{" "}
                  <span className="font-semibold">
                    {swapSuggestion.suggested.name}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {swapSuggestion.suggested.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {swapSuggestion.suggested.extraTime} •{" "}
                  <span className="text-primary">
                    {swapSuggestion.suggested.savings}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1">
                Keep original
              </Button>
              <Button className="flex-1">Swap it in</Button>
            </div>
          </div>

          <div className="flex items-start gap-2 border-t border-border p-4 text-xs text-muted-foreground">
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

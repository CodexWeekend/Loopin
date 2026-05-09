// @ts-nocheck
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Locate, 
  Plus, 
  Minus, 
  Layers, 
  Navigation2, 
  MapPin,
  Star,
  Clock,
  Sparkles,
  Bookmark,
  ChevronRight,
  X
} from "lucide-react"
import type { Place, DayStop } from "@/lib/types"
import dynamic from "next/dynamic"
import Image from "next/image"

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
)

interface MapViewProps {
  stops?: DayStop[]
  places?: Place[]
  selectedStopId?: string
  onStopClick?: (stop: DayStop) => void
  onPlaceClick?: (place: Place) => void
  showRoute?: boolean
  center?: { lat: number; lng: number }
}

// Tokyo coordinates for places
const PLACE_COORDINATES: Record<string, [number, number]> = {
  "meiji-shrine": [35.6764, 139.6993],
  "onibus-coffee": [35.6436, 139.6987],
  "menya-musashi": [35.6938, 139.7034],
  "21-21-design": [35.6603, 139.7318],
  "omoide-yokocho": [35.6936, 139.7003],
  "shinjuku-gyoen": [35.6851, 139.7100],
  "teamlab-planets": [35.6397, 139.7750],
  "tsukiji-outer": [35.6654, 139.7707],
  "senso-ji": [35.7148, 139.7967],
  "golden-gai": [35.6942, 139.7028],
  "fuglen-tokyo": [35.6623, 139.6944],
  "bakery-sasaki": [35.6456, 139.6932],
  "kappabashi": [35.7163, 139.7885],
  "yanaka-ginza": [35.7272, 139.7676],
  "shimokitazawa": [35.6617, 139.6683],
  "daikanyama": [35.6492, 139.7029],
  "nakano-broadway": [35.7078, 139.6647],
  "ueno-park": [35.7146, 139.7732],
  "ameya-yokocho": [35.7102, 139.7755],
  "ichiran-shibuya": [35.6594, 139.7005],
  "afuri-ebisu": [35.6469, 139.7103],
  "tonkatsu-maisen": [35.6645, 139.7117],
  "sushi-dai": [35.6525, 139.7882],
  "narisawa": [35.6673, 139.7245],
  "den": [35.6556, 139.7254],
  "sukiyabashi-jiro": [35.6715, 139.7637],
}

// Default Tokyo center
const TOKYO_CENTER: [number, number] = [35.6762, 139.6503]

// Place Detail Card Component for the popup
function PlaceDetailCard({ 
  place, 
  onClose,
  onViewDetails,
  onBookmark,
  isBookmarked = false,
  stopNumber
}: { 
  place: Place
  onClose: () => void
  onViewDetails?: () => void
  onBookmark?: () => void
  isBookmarked?: boolean
  stopNumber?: number
}) {
  const rating = place.rating || (3.5 + Math.random() * 1.5)
  const reviewCount = place.reviewCount || Math.floor(50 + Math.random() * 500)
  
  return (
    <div className="w-[320px] overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border/50">
      {/* Image Header */}
      <div className="relative h-40 w-full">
        <Image
          src={place.image}
          alt={place.name}
          fill
          className="object-cover"
          sizes="320px"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Stop number badge */}
        {stopNumber && (
          <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-lg">
            {stopNumber}
          </div>
        )}
        
        {/* Hidden gem badge */}
        {place.hiddenness === "hidden" && (
          <div className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Hidden Gem
          </div>
        )}
        
        {/* Category tag */}
        <div className="absolute right-3 bottom-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
          {place.category}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Title and bookmark */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {place.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {place.neighborhood || place.address}
            </p>
          </div>
          <button
            onClick={onBookmark}
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors",
              isBookmarked 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
          </button>
        </div>
        
        {/* Rating row */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star <= Math.floor(rating)
                      ? "fill-amber-400 text-amber-400"
                      : star - 0.5 <= rating
                      ? "fill-amber-400/50 text-amber-400"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({reviewCount.toLocaleString()} reviews)
          </span>
        </div>
        
        {/* Info chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{place.typicalDuration} min</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
            <span className="text-xs font-medium">
              {"$".repeat(place.costLevel)}
              <span className="text-muted-foreground/50">{"$".repeat(4 - place.costLevel)}</span>
            </span>
          </div>
          {place.estimatedCost > 0 && (
            <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              ~${place.estimatedCost}
            </div>
          )}
        </div>
        
        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {place.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {place.description}
        </p>
        
        {/* Action button */}
        <Button 
          onClick={onViewDetails}
          className="w-full gap-2"
          size="sm"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function MapView({
  stops = [],
  places = [],
  selectedStopId,
  onStopClick,
  onPlaceClick,
  showRoute = true,
}: MapViewProps) {
  const [mapReady, setMapReady] = useState(false)
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "terrain">("default")
  const [showLayerPicker, setShowLayerPicker] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<{
    place: Place
    stop: DayStop | null
    number: number
    position: [number, number]
  } | null>(null)
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState<Set<string>>(new Set())

  // Prepare markers data
  const markers = useMemo(() => {
    if (stops.length > 0) {
      return stops.map((stop, index) => ({
        id: stop.id,
        placeId: stop.place.id,
        number: index + 1,
        place: stop.place,
        stop,
        position: PLACE_COORDINATES[stop.place.id] || TOKYO_CENTER,
      }))
    }
    return places.map((place, index) => ({
      id: place.id,
      placeId: place.id,
      number: index + 1,
      place,
      stop: null,
      position: PLACE_COORDINATES[place.id] || TOKYO_CENTER,
    }))
  }, [stops, places])

  // Route path coordinates
  const routePath = useMemo(() => {
    if (!showRoute || markers.length < 2) return []
    return markers.map((m) => m.position)
  }, [markers, showRoute])

  // Calculate center based on markers
  const center = useMemo(() => {
    if (markers.length === 0) return TOKYO_CENTER
    const lats = markers.map((m) => m.position[0])
    const lngs = markers.map((m) => m.position[1])
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ] as [number, number]
  }, [markers])

  useEffect(() => {
    setMapReady(true)
  }, [])

  const handleMarkerClick = useCallback((marker: typeof markers[0]) => {
    setSelectedMarker({
      place: marker.place,
      stop: marker.stop,
      number: marker.number,
      position: marker.position,
    })
  }, [])

  const handleClosePopup = useCallback(() => {
    setSelectedMarker(null)
  }, [])

  const handleViewDetails = useCallback(() => {
    if (selectedMarker) {
      if (selectedMarker.stop) {
        onStopClick?.(selectedMarker.stop)
      } else {
        onPlaceClick?.(selectedMarker.place)
      }
    }
  }, [selectedMarker, onStopClick, onPlaceClick])

  const handleBookmark = useCallback(() => {
    if (selectedMarker) {
      setBookmarkedPlaces(prev => {
        const newSet = new Set(prev)
        if (newSet.has(selectedMarker.place.id)) {
          newSet.delete(selectedMarker.place.id)
        } else {
          newSet.add(selectedMarker.place.id)
        }
        return newSet
      })
    }
  }, [selectedMarker])

  // Map tile URLs
  const tileUrls = {
    default: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  }

  const tileAttributions = {
    default: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
    terrain: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  }

  if (!mapReady) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MapPin className="h-8 w-8 animate-pulse" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          font-family: inherit;
        }
        .custom-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(142 71% 35%) 100%);
          color: white;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15);
          border: 3px solid white;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .custom-marker::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid white;
        }
        .custom-marker.selected {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, hsl(142 71% 35%) 0%, hsl(142 71% 25%) 100%);
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.3), 0 6px 20px rgba(34, 197, 94, 0.5);
          z-index: 1000 !important;
          transform: translateY(-4px);
        }
        .custom-marker:hover {
          transform: scale(1.15) translateY(-2px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5), 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        .custom-marker.hidden-gem {
          background: linear-gradient(135deg, hsl(45 93% 47%) 0%, hsl(35 93% 40%) 100%);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        .custom-marker.hidden-gem:hover {
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5), 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        .leaflet-popup {
          margin-bottom: 20px;
        }
        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: visible;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-popup-close-button {
          display: none;
        }
        .leaflet-control-zoom {
          display: none;
        }
        .leaflet-control-attribution {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(8px);
          border-radius: 4px;
          padding: 2px 6px;
        }
      `}</style>

      <MapContainerWrapper
        center={center}
        markers={markers}
        routePath={routePath}
        selectedStopId={selectedStopId}
        selectedMarker={selectedMarker}
        onMarkerClick={handleMarkerClick}
        onClosePopup={handleClosePopup}
        onViewDetails={handleViewDetails}
        onBookmark={handleBookmark}
        bookmarkedPlaces={bookmarkedPlaces}
        tileUrl={tileUrls[mapStyle]}
        tileAttribution={tileAttributions[mapStyle]}
      />

      {/* Map controls */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-card shadow-lg hover:bg-card/90"
        >
          <Navigation2 className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full bg-card shadow-lg hover:bg-card/90",
            showLayerPicker && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => setShowLayerPicker(!showLayerPicker)}
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-20 right-3 z-[1000] flex flex-col overflow-hidden rounded-full bg-card shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-none border-b hover:bg-muted"
          id="zoom-in-btn"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-none hover:bg-muted"
          id="zoom-out-btn"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Current location button */}
      <div className="absolute bottom-3 right-3 z-[1000]">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-card shadow-lg hover:bg-card/90"
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* Layer picker */}
      {showLayerPicker && (
        <div className="absolute left-3 top-3 z-[1000] rounded-xl bg-card p-3 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Map Style
          </p>
          <div className="flex gap-2">
            {[
              { id: "default", label: "Default", preview: "bg-gradient-to-br from-[#f0ebe3] to-[#d4cfc7]" },
              { id: "satellite", label: "Satellite", preview: "bg-gradient-to-br from-[#2d4a3e] to-[#1a2f26]" },
              { id: "terrain", label: "Terrain", preview: "bg-gradient-to-br from-[#d4c4a8] to-[#a89880]" },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id as typeof mapStyle)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all",
                  mapStyle === style.id
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "h-12 w-12 rounded-lg shadow-inner",
                    style.preview
                  )}
                />
                <span className="text-xs font-medium">{style.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Route info badge */}
      {showRoute && markers.length > 1 && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-full bg-card px-4 py-2 shadow-lg">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">{markers.length} stops</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
            <span className="text-muted-foreground">~{calculateDistance(routePath)} km total</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Separate component for the map to handle hooks properly
function MapContainerWrapper({
  center,
  markers,
  routePath,
  selectedStopId,
  selectedMarker,
  onMarkerClick,
  onClosePopup,
  onViewDetails,
  onBookmark,
  bookmarkedPlaces,
  tileUrl,
  tileAttribution,
}: {
  center: [number, number]
  markers: Array<{
    id: string
    placeId: string
    number: number
    place: Place
    stop: DayStop | null
    position: [number, number]
  }>
  routePath: [number, number][]
  selectedStopId?: string
  selectedMarker: {
    place: Place
    stop: DayStop | null
    number: number
    position: [number, number]
  } | null
  onMarkerClick: (marker: typeof markers[0]) => void
  onClosePopup: () => void
  onViewDetails: () => void
  onBookmark: () => void
  bookmarkedPlaces: Set<string>
  tileUrl: string
  tileAttribution: string
}) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null)
  const [Popup, setPopup] = useState<typeof import("react-leaflet").Popup | null>(null)

  useEffect(() => {
    Promise.all([
      import("leaflet"),
      import("react-leaflet").then((mod) => mod.Popup),
    ]).then(([leaflet, PopupComponent]) => {
      setL(leaflet.default as typeof import("leaflet"))
      setPopup(() => PopupComponent)
    })
  }, [])

  if (!L) return null

  const PopupComponent = Popup

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={tileUrl} attribution={tileAttribution} />
      
      <MapController />

      {/* Route polyline */}
      {routePath.length > 1 && (
        <Polyline
          positions={routePath}
          pathOptions={{
            color: "hsl(142 71% 45%)",
            weight: 4,
            opacity: 0.8,
            dashArray: "12, 8",
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {/* Markers */}
      {markers.map((marker) => {
        const isSelected = selectedStopId === marker.id || selectedStopId === marker.placeId || 
          (selectedMarker?.place.id === marker.place.id)
        const isHiddenGem = marker.place.hiddenness === "hidden"
        const icon = L.divIcon({
          className: "",
          html: `<div class="custom-marker ${isSelected ? "selected" : ""} ${isHiddenGem ? "hidden-gem" : ""}">${marker.number}</div>`,
          iconSize: isSelected ? [44, 44] : [36, 36],
          iconAnchor: isSelected ? [22, 44] : [18, 36],
        })

        return (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={icon}
            eventHandlers={{
              click: () => onMarkerClick(marker),
            }}
          >
            {PopupComponent && selectedMarker?.place.id === marker.place.id && (
              <PopupComponent
                position={marker.position}
                offset={[0, -30]}
                closeButton={false}
                autoPan={true}
              >
                <PlaceDetailCard
                  place={marker.place}
                  onClose={onClosePopup}
                  onViewDetails={onViewDetails}
                  onBookmark={onBookmark}
                  isBookmarked={bookmarkedPlaces.has(marker.place.id)}
                  stopNumber={marker.number}
                />
              </PopupComponent>
            )}
          </Marker>
        )
      })}
    </MapContainer>
  )
}

// Controller component for zoom buttons
function MapController() {
  useEffect(() => {
    const zoomIn = document.getElementById("zoom-in-btn")
    const zoomOut = document.getElementById("zoom-out-btn")

    const handleZoomIn = () => {
      const mapContainer = document.querySelector(".leaflet-container")
      if (mapContainer && (mapContainer as any)._leaflet_map) {
        ;(mapContainer as any)._leaflet_map.zoomIn()
      }
    }

    const handleZoomOut = () => {
      const mapContainer = document.querySelector(".leaflet-container")
      if (mapContainer && (mapContainer as any)._leaflet_map) {
        ;(mapContainer as any)._leaflet_map.zoomOut()
      }
    }

    zoomIn?.addEventListener("click", handleZoomIn)
    zoomOut?.addEventListener("click", handleZoomOut)

    return () => {
      zoomIn?.removeEventListener("click", handleZoomIn)
      zoomOut?.removeEventListener("click", handleZoomOut)
    }
  }, [])

  return null
}

// Calculate approximate distance from route
function calculateDistance(path: [number, number][]): string {
  if (path.length < 2) return "0"
  
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const [lat1, lon1] = path[i - 1]
    const [lat2, lon2] = path[i]
    
    // Haversine formula
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    total += R * c
  }
  
  return total.toFixed(1)
}

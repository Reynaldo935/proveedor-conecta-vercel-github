"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { authFetch } from "@/lib/client-auth"
import {
  Megaphone,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdData {
  id: string
  title: string
  description: string
  imageUrl: string
  targetUrl: string
  plan: string
  type: string
  amount: number
  status: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  seller: {
    name: string
  }
}

interface AdBannerProps {
  /** If true, suppress ad display (for premium/no-ads users) */
  suppressAds?: boolean
  /** Category context to potentially target ads (future use) */
  category?: string
  /** Maximum number of ads to show */
  maxAds?: number
  /** Compact mode for sidebar/embed */
  compact?: boolean
}

// ─── Local dismissed state management ────────────────────────────────────────

const DISMISSED_KEY = "pc_dismissed_ads"

function getDismissedAds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { id: string; dismissedAt: number }[]
    const now = Date.now()
    const valid = parsed.filter(
      (item) => now - item.dismissedAt < 24 * 60 * 60 * 1000
    ) // 24h expiry
    return new Set(valid.map((item) => item.id))
  } catch {
    return new Set()
  }
}

function dismissAd(adId: string) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const existing: { id: string; dismissedAt: number }[] = raw
      ? JSON.parse(raw)
      : []
    const updated = [
      ...existing.filter((item) => item.id !== adId),
      { id: adId, dismissedAt: Date.now() },
    ]
    // Keep only last 50 entries
    if (updated.length > 50) updated.splice(0, updated.length - 50)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated))
  } catch {
    // localStorage not available
  }
}

// ─── Impression Tracking ─────────────────────────────────────────────────────

const IMPRESSION_KEY = "pc_ad_impressions"

function trackImpression(adId: string) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(IMPRESSION_KEY)
    const impressions: Record<string, number> = raw ? JSON.parse(raw) : {}
    impressions[adId] = (impressions[adId] || 0) + 1
    localStorage.setItem(IMPRESSION_KEY, JSON.stringify(impressions))

    // Fire-and-forget server-side impression track
    authFetch("/api/advertisements/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId, event: "impression" }),
    }).catch(() => {
      // Silently fail
    })
  } catch {
    // localStorage not available
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdBanner({
  suppressAds = false,
  category,
  maxAds = 3,
  compact = false,
}: AdBannerProps) {
  const [ads, setAds] = useState<AdData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [videoMuted, setVideoMuted] = useState(true)
  const [videoPlaying, setVideoPlaying] = useState(true)
  const impressionTracked = useRef<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  // ─── Fetch Ads ─────────────────────────────────────────────────────────────

  const fetchAds = useCallback(async () => {
    try {
      const res = await authFetch("/api/advertisements/public")
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const dismissed = getDismissedAds()
        const visibleAds = data.data
          .filter((ad: AdData) => !dismissed.has(ad.id))
          .slice(0, maxAds)
        setAds(visibleAds)
        setDismissedIds(dismissed)
      }
    } catch {
      // Silently fail - ads are not critical
    } finally {
      setLoading(false)
    }
  }, [maxAds])

  useEffect(() => {
    if (suppressAds) {
      setLoading(false)
      return
    }
    fetchAds()
  }, [suppressAds, fetchAds])

  // ─── Track Impressions ─────────────────────────────────────────────────────

  useEffect(() => {
    if (ads.length === 0) return
    const currentAd = ads[currentIndex]
    if (currentAd && !impressionTracked.current.has(currentAd.id)) {
      impressionTracked.current.add(currentAd.id)
      trackImpression(currentAd.id)
    }
  }, [ads, currentIndex])

  // ─── Auto-rotate carousel ──────────────────────────────────────────────────

  useEffect(() => {
    if (ads.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, 8000) // Rotate every 8 seconds
    return () => clearInterval(timer)
  }, [ads.length])

  // ─── Dismiss Ad ────────────────────────────────────────────────────────────

  const handleDismiss = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    dismissAd(adId)
    setDismissedIds((prev) => new Set([...prev, adId]))

    // Remove from visible ads
    setAds((prev) => {
      const filtered = prev.filter((ad) => ad.id !== adId)
      if (currentIndex >= filtered.length && filtered.length > 0) {
        setCurrentIndex(filtered.length - 1)
      }
      return filtered
    })
  }

  // ─── Handle CTA Click ──────────────────────────────────────────────────────

  const handleCtaClick = (ad: AdData, e: React.MouseEvent) => {
    // Track click
    try {
      authFetch("/api/advertisements/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id, event: "click" }),
      }).catch(() => {})
    } catch {
      // Silently fail
    }

    if (ad.targetUrl) {
      e.preventDefault()
      window.open(ad.targetUrl, "_blank", "noopener,noreferrer")
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  // Don't render anything if suppressed or no ads
  if (suppressAds) return null

  // Loading skeleton
  if (loading) {
    return (
      <Card className="overflow-hidden border-primary/10">
        <div className="relative">
          <Skeleton className="w-full h-40" />
          <div className="absolute top-3 left-3">
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <CardContent className="p-3 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  if (ads.length === 0) return null

  const currentAd = ads[currentIndex]
  if (!currentAd) return null

  const isVideo = currentAd.imageUrl?.match(/\.(mp4|webm|ogg|mov)$/i)

  return (
    <div ref={containerRef} className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card
            className={`overflow-hidden border-primary/15 hover:shadow-lg transition-shadow group ${
              compact ? "" : "cursor-pointer"
            }`}
            onClick={(e) => handleCtaClick(currentAd, e)}
          >
            {/* ─── Media Section ────────────────────────────────────────── */}
            {currentAd.imageUrl ? (
              <div className="relative">
                {isVideo ? (
                  <div className="relative">
                    <video
                      src={currentAd.imageUrl}
                      className={`w-full object-cover ${
                        compact ? "h-32" : "h-44"
                      }`}
                      autoPlay
                      loop
                      muted={videoMuted}
                      playsInline
                      onPlay={() => setVideoPlaying(true)}
                      onPause={() => setVideoPlaying(false)}
                    />
                    {/* Video controls overlay */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setVideoMuted(!videoMuted)
                        }}
                      >
                        {videoMuted ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentAd.imageUrl}
                    alt={currentAd.title}
                    className={`w-full object-cover ${
                      compact ? "h-32" : "h-44"
                    }`}
                    loading="lazy"
                  />
                )}

                {/* Patrocinado badge */}
                <Badge className="absolute top-2.5 left-2.5 bg-primary text-primary-foreground gap-1 shadow-md text-xs">
                  <Megaphone className="h-3 w-3" />
                  Patrocinado
                </Badge>

                {/* Dismiss button */}
                <button
                  onClick={(e) => handleDismiss(currentAd.id, e)}
                  className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                  aria-label="Cerrar anuncio"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Carousel indicators */}
                {ads.length > 1 && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {ads.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentIndex(idx)
                        }}
                        className={`rounded-full transition-all ${
                          idx === currentIndex
                            ? "w-5 h-1.5 bg-white"
                            : "w-1.5 h-1.5 bg-white/50 hover:bg-white/75"
                        }`}
                        aria-label={`Ir a anuncio ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`relative bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 flex items-center justify-center ${
                  compact ? "h-24" : "h-32"
                }`}
              >
                <Megaphone className="h-10 w-10 text-primary/20" />
                <Badge className="absolute top-2.5 left-2.5 bg-primary text-primary-foreground gap-1 shadow-md text-xs">
                  <Megaphone className="h-3 w-3" />
                  Patrocinado
                </Badge>
                <button
                  onClick={(e) => handleDismiss(currentAd.id, e)}
                  className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                  aria-label="Cerrar anuncio"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ─── Content Section ──────────────────────────────────────── */}
            <CardContent className={`${compact ? "p-2.5" : "p-3.5"} space-y-2`}>
              <h3
                className={`font-bold leading-tight line-clamp-1 ${
                  compact ? "text-sm" : "text-base"
                }`}
              >
                {currentAd.title}
              </h3>
              {currentAd.description && (
                <p
                  className={`text-muted-foreground line-clamp-2 ${
                    compact ? "text-xs" : "text-sm"
                  }`}
                >
                  {currentAd.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {currentAd.seller?.name || "Vendedor"}
                  </span>
                </div>

                {currentAd.targetUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={(e) => handleCtaClick(currentAd, e)}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver Más
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* ─── Carousel Navigation (outside card) ─────────────────────────── */}
      {ads.length > 1 && !compact && (
        <div className="flex items-center justify-center gap-3 mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              setCurrentIndex(
                (prev) => (prev - 1 + ads.length) % ads.length
              )
            }
            aria-label="Anuncio anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1} / {ads.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              setCurrentIndex((prev) => (prev + 1) % ads.length)
            }
            aria-label="Siguiente anuncio"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

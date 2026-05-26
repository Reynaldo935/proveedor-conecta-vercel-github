"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import { useAppStore } from "@/store/app-store"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Shield,
  ChevronDown,
  PenLine,
  Filter,
} from "lucide-react"

interface ReviewData {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerAvatar: string
  transactionId: string
  rating: number
  comment: string
  reviewType: string
  response: string
  helpfulYes: number
  helpfulNo: number
  userVote: boolean | null
  createdAt: string
}

interface ReviewsData {
  reviews: ReviewData[]
  averageRating: number
  totalReviews: number
  trustBadge: "BRONZE" | "SILVER" | "GOLD" | null
}

type SortOption = "recent" | "highest" | "lowest" | "helpful"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recientes" },
  { value: "highest", label: "Mayor puntaje" },
  { value: "lowest", label: "Menor puntaje" },
  { value: "helpful", label: "Más útiles" },
]

const TRUST_BADGE_CONFIG: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  BRONZE: { emoji: "🥉", label: "Bronce", color: "text-amber-700", bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  SILVER: { emoji: "🥈", label: "Plata", color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700" },
  GOLD: { emoji: "🥇", label: "Oro", color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700" },
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-6 w-6" }
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
            i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-700"
          }`}
        />
      ))}
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function ReviewsSection({ targetId }: { targetId: string }) {
  const { user, isAuthenticated } = useAuthStore()
  const { navigate } = useAppStore()
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortOption>("recent")
  const [votingReviewId, setVotingReviewId] = useState<string | null>(null)
  const [writeDialogOpen, setWriteDialogOpen] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [expandedResponse, setExpandedResponse] = useState<Set<string>>(new Set())

  const fetchReviews = useCallback(async () => {
    if (!isAuthenticated || !targetId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await authFetch(`/api/reviews?targetId=${targetId}&sort=${sort}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch {
      toast.error("Error al cargar reseñas")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, targetId, sort])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para votar")
      navigate("login")
      return
    }
    setVotingReviewId(reviewId)
    try {
      const res = await authFetch("/api/reviews/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, isHelpful }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(isHelpful ? "¡Votado como útil!" : "Votado como no útil")
        fetchReviews()
      } else {
        toast.error(result.error || "Error al votar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setVotingReviewId(null)
    }
  }

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      toast.error("Escribe un comentario")
      return
    }
    setSubmitting(true)
    try {
      const res = await authFetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId,
          transactionId: "demo_transaction",
          rating: newRating,
          comment: newComment,
          reviewType: "SELLER_REVIEW",
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("¡Reseña publicada! +5 puntos de lealtad")
        setWriteDialogOpen(false)
        setNewComment("")
        setNewRating(5)
        fetchReviews()
      } else {
        toast.error(result.error || "Error al publicar reseña")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleResponse = (reviewId: string) => {
    setExpandedResponse((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) next.delete(reviewId)
      else next.add(reviewId)
      return next
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold">Inicia sesión para ver reseñas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with average rating */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
        >
          <Star className="h-5 w-5 text-white fill-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: "#1A5276" }}>
            Reseñas y Calificaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Opiniones verificadas de compradores reales
          </p>
        </div>
      </motion.div>

      {loading && !data ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Rating Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Average rating */}
                  <div className="text-center">
                    <p className="text-5xl font-bold" style={{ color: "#1A5276" }}>
                      {data?.averageRating ?? 0}
                    </p>
                    <StarDisplay rating={data?.averageRating ?? 0} size="lg" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {data?.totalReviews ?? 0} reseña{(data?.totalReviews ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Trust badge */}
                  {data?.trustBadge && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                        TRUST_BADGE_CONFIG[data.trustBadge]?.bgColor || ""
                      }`}
                    >
                      <Shield className={`h-5 w-5 ${TRUST_BADGE_CONFIG[data.trustBadge]?.color || ""}`} />
                      <span className="text-lg">{TRUST_BADGE_CONFIG[data.trustBadge]?.emoji}</span>
                      <span className={`text-sm font-semibold ${TRUST_BADGE_CONFIG[data.trustBadge]?.color || ""}`}>
                        Vendedor {TRUST_BADGE_CONFIG[data.trustBadge]?.label}
                      </span>
                    </div>
                  )}

                  {/* Write review */}
                  <div className="sm:ml-auto">
                    <Dialog open={writeDialogOpen} onOpenChange={setWriteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="font-semibold"
                          style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
                        >
                          <PenLine className="h-4 w-4 mr-2" />
                          Escribir Reseña
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Escribir Reseña</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* Star rating selector */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Calificación</label>
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <motion.button
                                  key={i}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setNewRating(i + 1)}
                                >
                                  <Star
                                    className={`h-8 w-8 transition-colors ${
                                      i < newRating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-200 dark:text-gray-700"
                                    }`}
                                  />
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          {/* Comment */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Comentario</label>
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Describe tu experiencia con este vendedor..."
                              rows={4}
                              style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            🎁 Recibirás 5 puntos de lealtad por cada reseña publicada
                          </p>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button
                            onClick={handleSubmitReview}
                            disabled={submitting || !newComment.trim()}
                            style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
                          >
                            {submitting ? "Publicando..." : "Publicar Reseña"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sort buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={sort === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSort(opt.value)}
                className={sort === opt.value ? "" : ""}
                style={
                  sort === opt.value
                    ? { background: "linear-gradient(135deg, #1A5276, #2E86C1)" }
                    : {}
                }
              >
                {opt.label}
              </Button>
            ))}
          </motion.div>

          {/* Reviews List */}
          <div className="space-y-4">
            <AnimatePresence>
              {!data?.reviews || data.reviews.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aún no hay reseñas. ¡Sé el primero en compartir tu opinión!
                  </p>
                </motion.div>
              ) : (
                data.reviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        {/* Review header */}
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={review.reviewerAvatar || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {review.reviewerName?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{review.reviewerName}</span>
                              <StarDisplay rating={review.rating} size="sm" />
                              <Badge variant="outline" className="text-xs">
                                {review.rating}/5
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Comment */}
                        <p className="mt-3 text-sm leading-relaxed">{review.comment}</p>

                        {/* Helpful button */}
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleVote(review.id, true)}
                            disabled={votingReviewId === review.id}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Útil ({review.helpfulYes})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 text-muted-foreground"
                            onClick={() => handleVote(review.id, false)}
                            disabled={votingReviewId === review.id}
                          >
                            No útil ({review.helpfulNo})
                          </Button>
                        </div>

                        {/* Seller response */}
                        {review.response && (
                          <div className="mt-3 pl-4 border-l-2 border-primary/30">
                            <button
                              onClick={() => toggleResponse(review.id)}
                              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Respuesta del vendedor
                              <ChevronDown
                                className={`h-3 w-3 transition-transform ${
                                  expandedResponse.has(review.id) ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <AnimatePresence>
                              {expandedResponse.has(review.id) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2 text-sm bg-muted/50 rounded-lg p-3"
                                >
                                  {review.response}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

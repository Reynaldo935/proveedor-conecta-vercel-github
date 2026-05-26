"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { PAYMENT_METHODS } from "@/lib/validators"
import { authFetch } from "@/lib/client-auth"
import {
  ChevronLeft, Camera, Store, User, Loader2, Save, CheckCircle2,
  Wallet, Heart, MessageCircle, Share2, Plus, ImagePlus, Video,
  Send, ThumbsUp, Clock, Trash2, Pencil, Package, Globe, MapPin,
  Phone, ExternalLink, MoreVertical, X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ───────────────────────────────────────────────────────────────────

interface WallPost {
  id: string
  businessProfileId: string
  content: string
  imageUrl: string
  videoUrl: string
  postType: string
  createdAt: string
  updatedAt: string
  likes?: { id: string; userId: string }[]
  comments?: { id: string }[]
  _count?: { likes: number; comments: number }
}

interface Comment {
  id: string
  userId: string
  postId: string
  content: string
  createdAt: string
  user: { id: string; name: string; avatar: string }
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  discountPrice: number | null
  images: string[]
  category: string
  status: string
  publishedAt: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileSettings() {
  const { navigate } = useAppStore()
  const { user, setUser } = useAuthStore()

  // Personal form
  const [form, setForm] = useState({
    name: "", phone: "", address: "", bio: "", avatar: "",
    coverPhoto: "", website: "",
  })

  // Business form
  const [businessForm, setBusinessForm] = useState({
    businessName: "", description: "", category: "", address: "",
    phone: "", hours: "", paymentMethods: [] as string[],
  })

  // UI state
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null) // "avatar" | "cover" | null
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState<"personal" | "business" | null>(null)
  const [activeTab, setActiveTab] = useState("personal")

  // Wall state
  const [wallPosts, setWallPosts] = useState<WallPost[]>([])
  const [loadingWall, setLoadingWall] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostImage, setNewPostImage] = useState<string | null>(null)
  const [newPostVideo, setNewPostVideo] = useState<string | null>(null)
  const [postType, setPostType] = useState<"text" | "photo" | "video">("text")
  const [creatingPost, setCreatingPost] = useState(false)
  const [showPostDialog, setShowPostDialog] = useState(false)

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})

  // Liked state
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Refs
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const postImageInputRef = useRef<HTMLInputElement>(null)
  const postVideoInputRef = useRef<HTMLInputElement>(null)

  // ─── Load Profile ────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authFetch("/api/auth/me")
        const data = await res.json()
        if (data.success && data.data) {
          const u = data.data
          setUser(data.data)
          setForm({
            name: u.name || "",
            phone: u.phone || "",
            address: u.address || "",
            bio: u.bio || "",
            avatar: u.avatar || "",
            coverPhoto: u.coverPhoto || "",
            website: u.website || "",
          })
          if (u.businessProfile) {
            const bp = u.businessProfile
            setBusinessForm({
              businessName: bp.businessName || "",
              description: bp.description || "",
              category: bp.category || "",
              address: bp.address || "",
              phone: bp.phone || "",
              hours: bp.hours || "",
              paymentMethods: bp.paymentMethods ? (() => { try { return JSON.parse(bp.paymentMethods) } catch { return [] } })() : [],
            })
          }
        }
      } catch {
        toast.error("Error al cargar perfil")
      } finally {
        setLoadingProfile(false)
      }
    }
    loadProfile()
  }, [setUser])

  // ─── Load Wall Posts ─────────────────────────────────────────────────────────

  const loadWallPosts = useCallback(async () => {
    if (!user?.businessProfile?.id) return
    setLoadingWall(true)
    try {
      const res = await authFetch(`/api/wall?businessProfileId=${user.businessProfile.id}`)
      const data = await res.json()
      if (data.success) {
        setWallPosts(data.data || [])
      }
    } catch {
      toast.error("Error al cargar publicaciones")
    } finally {
      setLoadingWall(false)
    }
  }, [user?.businessProfile?.id])

  // ─── Load Products ───────────────────────────────────────────────────────────

  const loadProducts = useCallback(async () => {
    if (!user?.id) return
    setLoadingProducts(true)
    try {
      const res = await authFetch(`/api/products?sellerId=${user.id}`)
      const data = await res.json()
      if (data.success) {
        setProducts(data.data || [])
      }
    } catch {
      toast.error("Error al cargar productos")
    } finally {
      setLoadingProducts(false)
    }
  }, [user?.id])

  // ─── Load on tab change ──────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === "wall" && user?.businessProfile?.id) {
      loadWallPosts()
    }
    if (activeTab === "products" && user?.id) {
      loadProducts()
    }
  }, [activeTab, user?.businessProfile?.id, user?.id, loadWallPosts, loadProducts])

  // ─── Upload Helper ───────────────────────────────────────────────────────────

  const uploadFile = async (file: File, subfolder: string): Promise<string | null> => {
    const fd = new FormData()
    fd.append("files", file)
    fd.append("subfolder", subfolder)
    try {
      const res = await authFetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.success && d.data?.[0]) {
        return d.data[0]
      }
      toast.error(d.error || "Error al subir archivo")
      return null
    } catch {
      toast.error("Error al subir archivo")
      return null
    }
  }

  // ─── Refresh User ────────────────────────────────────────────────────────────

  const refreshUser = async () => {
    try {
      const meRes = await authFetch("/api/auth/me")
      const meData = await meRes.json()
      if (meData.success && meData.data) {
        setUser(meData.data)
        return meData.data
      }
    } catch {
      // refresh failed
    }
    return null
  }

  // ─── Avatar Upload ──────────────────────────────────────────────────────────

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading("avatar")
    const url = await uploadFile(e.target.files[0], "avatars")
    if (url) {
      setForm(f => ({ ...f, avatar: url }))
      const res = await authFetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      })
      const d = await res.json()
      if (d.success) setUser(d.data)
      toast.success("Foto de perfil actualizada")
    }
    setUploading(null)
    e.target.value = ""
  }

  // ─── Cover Upload ───────────────────────────────────────────────────────────

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading("cover")
    const url = await uploadFile(e.target.files[0], "covers")
    if (url) {
      setForm(f => ({ ...f, coverPhoto: url }))
      const res = await authFetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhoto: url }),
      })
      const d = await res.json()
      if (d.success) setUser(d.data)
      toast.success("Foto de portada actualizada")
    }
    setUploading(null)
    e.target.value = ""
  }

  // ─── Save Personal ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          bio: form.bio,
          avatar: form.avatar,
          coverPhoto: form.coverPhoto,
          website: form.website,
        }),
      })
      const d = await res.json()
      if (d.success) {
        // Refresh from server to ensure full data
        const refreshedUser = await refreshUser()
        if (refreshedUser) {
          setForm({
            name: refreshedUser.name || "",
            phone: refreshedUser.phone || "",
            address: refreshedUser.address || "",
            bio: refreshedUser.bio || "",
            avatar: refreshedUser.avatar || "",
            coverPhoto: refreshedUser.coverPhoto || "",
            website: refreshedUser.website || "",
          })
        }
        setSavedSuccess("personal")
        toast.success("Perfil actualizado exitosamente")
        setTimeout(() => setSavedSuccess(null), 3000)
      } else {
        toast.error(d.error || "Error al actualizar")
      }
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  // ─── Save Business ──────────────────────────────────────────────────────────

  const handleBusinessSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const res = await authFetch(`/api/users/${user.id}/business`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessForm),
      })
      const d = await res.json()
      if (d.success) {
        const refreshedUser = await refreshUser()
        if (refreshedUser?.businessProfile) {
          const bp = refreshedUser.businessProfile
          setBusinessForm({
            businessName: bp.businessName || "",
            description: bp.description || "",
            category: bp.category || "",
            address: bp.address || "",
            phone: bp.phone || "",
            hours: bp.hours || "",
            paymentMethods: bp.paymentMethods ? (() => { try { return JSON.parse(bp.paymentMethods) } catch { return [] } })() : [],
          })
        }
        setSavedSuccess("business")
        toast.success("Perfil de negocio actualizado")
        setTimeout(() => setSavedSuccess(null), 3000)
      } else {
        toast.error(d.error || "Error al actualizar negocio")
      }
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle Payment Method ──────────────────────────────────────────────────

  const togglePayment = (id: string) => {
    setBusinessForm(f => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(id)
        ? f.paymentMethods.filter(p => p !== id)
        : [...f.paymentMethods, id],
    }))
  }

  // ─── Create Post ────────────────────────────────────────────────────────────

  const handleCreatePost = async () => {
    if (!user?.businessProfile?.id) return
    if (!newPostContent.trim() && !newPostImage && !newPostVideo) {
      toast.error("Agrega contenido, imagen o video")
      return
    }
    setCreatingPost(true)
    try {
      const res = await authFetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessProfileId: user.businessProfile.id,
          content: newPostContent.trim(),
          imageUrl: newPostImage || "",
          videoUrl: newPostVideo || "",
          postType: postType,
        }),
      })
      const d = await res.json()
      if (d.success) {
        toast.success("Publicación creada")
        setNewPostContent("")
        setNewPostImage(null)
        setNewPostVideo(null)
        setPostType("text")
        setShowPostDialog(false)
        loadWallPosts()
      } else {
        toast.error(d.error || "Error al crear publicación")
      }
    } catch {
      toast.error("Error al crear publicación")
    } finally {
      setCreatingPost(false)
    }
  }

  // ─── Like Post ──────────────────────────────────────────────────────────────

  const handleLikePost = async (postId: string) => {
    const wasLiked = likedPosts[postId]
    setLikedPosts(prev => ({ ...prev, [postId]: !wasLiked }))
    try {
      const res = await authFetch("/api/wall/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })
      const d = await res.json()
      if (d.success) {
        setLikedPosts(prev => ({ ...prev, [postId]: d.data.liked }))
        // Update post like count
        setWallPosts(prev => prev.map(p => {
          if (p.id !== postId) return p
          const countDelta = d.data.liked ? 1 : -1
          return { ...p, _count: { ...(p._count ?? { likes: 0, comments: 0 }), likes: Math.max(0, (p._count?.likes ?? 0) + countDelta) } }
        }))
      }
    } catch {
      setLikedPosts(prev => ({ ...prev, [postId]: wasLiked }))
    }
  }

  // ─── Load Comments ──────────────────────────────────────────────────────────

  const loadComments = async (postId: string) => {
    try {
      const res = await authFetch(`/api/wall/${postId}/comments`)
      const d = await res.json()
      if (d.success) {
        setPostComments(prev => ({ ...prev, [postId]: d.data || [] }))
      }
    } catch {
      toast.error("Error al cargar comentarios")
    }
  }

  // ─── Toggle Comments ────────────────────────────────────────────────────────

  const toggleComments = (postId: string) => {
    const willExpand = !expandedComments[postId]
    setExpandedComments(prev => ({ ...prev, [postId]: willExpand }))
    if (willExpand) {
      loadComments(postId)
    }
  }

  // ─── Submit Comment ─────────────────────────────────────────────────────────

  const submitComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return
    setSubmittingComment(prev => ({ ...prev, [postId]: true }))
    try {
      const res = await authFetch("/api/wall/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      })
      const d = await res.json()
      if (d.success) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }))
        loadComments(postId)
        // Update comment count
        setWallPosts(prev => prev.map(p => {
          if (p.id !== postId) return p
          return { ...p, _count: { ...(p._count ?? { likes: 0, comments: 0 }), comments: (p._count?.comments ?? 0) + 1 } }
        }))
        toast.success("Comentario agregado")
      } else {
        toast.error(d.error || "Error al comentar")
      }
    } catch {
      toast.error("Error al comentar")
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }))
    }
  }

  // ─── Delete Post ────────────────────────────────────────────────────────────

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await authFetch(`/api/wall?id=${postId}`, { method: "DELETE" })
      const d = await res.json()
      if (d.success) {
        toast.success("Publicación eliminada")
        setWallPosts(prev => prev.filter(p => p.id !== postId))
      } else {
        toast.error(d.error || "Error al eliminar")
      }
    } catch {
      toast.error("Error al eliminar")
    }
  }

  // ─── Delete Product ─────────────────────────────────────────────────────────

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await authFetch(`/api/products/${productId}`, { method: "DELETE" })
      const d = await res.json()
      if (d.success) {
        toast.success("Producto eliminado")
        setProducts(prev => prev.filter(p => p.id !== productId))
      } else {
        toast.error(d.error || "Error al eliminar")
      }
    } catch {
      toast.error("Error al eliminar")
    }
  }

  // ─── Upload Post Media ──────────────────────────────────────────────────────

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const url = await uploadFile(e.target.files[0], "wall")
    if (url) {
      setNewPostImage(url)
      setPostType("photo")
    }
    e.target.value = ""
  }

  const handlePostVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const url = await uploadFile(e.target.files[0], "wall")
    if (url) {
      setNewPostVideo(url)
      setPostType("video")
    }
    e.target.value = ""
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Ahora"
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `hace ${days}d`
    return new Date(dateStr).toLocaleDateString("es-NI", { day: "numeric", month: "short" })
  }

  // ─── Loading Skeleton ────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="flex items-end gap-4 -mt-10 px-4">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse border-4 border-background" />
          <div className="space-y-2 pb-2 flex-1">
            <div className="h-5 w-36 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  const isSeller = user?.role === "SELLER" || user?.role === "ADMIN"

  return (
    <div className="max-w-2xl mx-auto">
      {/* ─── Back Button ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-4 pb-0"
      >
        <Button variant="ghost" onClick={() => navigate("home")} className="mb-2 -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════════════
          SECTION 1: Cover Photo + Avatar (Facebook-style)
      ═════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg rounded-b-2xl">
          {/* Cover Photo */}
          <div
            className="relative h-48 sm:h-56 bg-gradient-to-br from-[#1A5276] via-[#2E86C1] to-[#3498DB] cursor-pointer group overflow-hidden"
            onClick={() => coverInputRef.current?.click()}
          >
            {form.coverPhoto && (
              <img
                src={form.coverPhoto}
                alt="Portada"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                {uploading === "cover" ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
                <span className="text-white text-sm font-medium">Cambiar portada</span>
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>

          {/* Avatar + Info */}
          <CardContent className="p-4 sm:p-6 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar */}
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  <AvatarImage src={form.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                  {uploading === "avatar" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Name + Badges */}
              <div className="flex-1 text-center sm:text-left pb-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-bold text-xl sm:text-2xl">{user?.name || "Usuario"}</h2>
                  {user?.isVerified && (
                    <Badge className="bg-sky-500 text-white text-xs px-1.5 py-0">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      user?.role === "SELLER"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : user?.role === "ADMIN"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}
                  >
                    {user?.role === "SELLER" ? "🏪 Vendedor" : user?.role === "ADMIN" ? "🛡️ Admin" : "🛒 Comprador"}
                  </Badge>
                  {user?.emailVerified && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      ✓ Email verificado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Balance Card ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="px-4 pt-4"
      >
        <Card className="border-0 shadow-md bg-gradient-to-r from-[#1A5276]/5 via-[#2E86C1]/5 to-[#3498DB]/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#1A5276] to-[#2E86C1] flex items-center justify-center shadow-md">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Mi Saldo</p>
                  <p className="text-xl font-bold bg-gradient-to-r from-[#1A5276] to-[#2E86C1] bg-clip-text text-transparent">
                    {formatPrice(user?.balance ?? 0)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#2E86C1]/30 text-[#2E86C1] hover:bg-[#2E86C1]/10"
                onClick={async () => {
                  try {
                    const res = await authFetch("/api/auth/recharge", { method: "POST" })
                    const d = await res.json()
                    if (d.success) {
                      setUser(d.data)
                      toast.success("💰 Saldo recargado exitosamente")
                    } else {
                      toast.error(d.error || "Error al recargar")
                    }
                  } catch {
                    toast.error("Error al recargar saldo")
                  }
                }}
              >
                💰 Recargar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════════════
          TABS: Personal | Business | Wall | Products
      ═════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="px-4 pt-4 pb-8"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-auto flex-wrap">
            <TabsTrigger value="personal" className="flex-1 min-w-0">
              <User className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Personal</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            {isSeller && (
              <TabsTrigger value="business" className="flex-1 min-w-0">
                <Store className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Negocio</span>
                <span className="sm:hidden">Neg.</span>
              </TabsTrigger>
            )}
            {isSeller && (
              <TabsTrigger value="wall" className="flex-1 min-w-0">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Muro</span>
                <span className="sm:hidden">Muro</span>
              </TabsTrigger>
            )}
            {isSeller && (
              <TabsTrigger value="products" className="flex-1 min-w-0">
                <Package className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Productos</span>
                <span className="sm:hidden">Prod.</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* ═════════════════════════════════════════════════════════════════════
              SECTION 2: Personal Info Tab
          ═════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="personal" className="mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-[#2E86C1]" /> Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre completo
                  </Label>
                  <Input
                    id="p-name"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="p-phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono
                    </Label>
                    <Input
                      id="p-phone"
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="8XXX-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-address" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Dirección
                    </Label>
                    <Input
                      id="p-address"
                      value={form.address}
                      onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Managua, Nicaragua"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p-website" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Sitio web
                  </Label>
                  <Input
                    id="p-website"
                    value={form.website}
                    onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://mi-negocio.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p-bio">Biografía</Label>
                  <Textarea
                    id="p-bio"
                    value={form.bio}
                    onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Cuéntanos sobre ti..."
                    className="resize-none"
                  />
                </div>

                <AnimatePresence>
                  {savedSuccess === "personal" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Cambios guardados exitosamente
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  className="w-full bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white shadow-md"
                  onClick={handleSave}
                  disabled={saving}
                  size="lg"
                >
                  {saving ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Guardar Cambios</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════════
              SECTION 3: Business Profile Tab
          ═════════════════════════════════════════════════════════════════════ */}
          {isSeller && (
            <TabsContent value="business" className="mt-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-amber-500" /> Perfil de Negocio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="b-name">Nombre del negocio</Label>
                      <Input
                        id="b-name"
                        value={businessForm.businessName}
                        onChange={(e) => setBusinessForm(f => ({ ...f, businessName: e.target.value }))}
                        placeholder="Mi Negocio S.A."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-cat">Categoría</Label>
                      <Input
                        id="b-cat"
                        value={businessForm.category}
                        onChange={(e) => setBusinessForm(f => ({ ...f, category: e.target.value }))}
                        placeholder="Construcción"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b-desc">Descripción</Label>
                    <Textarea
                      id="b-desc"
                      value={businessForm.description}
                      onChange={(e) => setBusinessForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      placeholder="Describe tu negocio..."
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="b-phone">Teléfono del negocio</Label>
                      <Input
                        id="b-phone"
                        value={businessForm.phone}
                        onChange={(e) => setBusinessForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="8XXX-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-hours">Horarios</Label>
                      <Input
                        id="b-hours"
                        value={businessForm.hours}
                        onChange={(e) => setBusinessForm(f => ({ ...f, hours: e.target.value }))}
                        placeholder="Lun-Vie 8am-5pm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b-addr">Dirección del negocio</Label>
                    <Input
                      id="b-addr"
                      value={businessForm.address}
                      onChange={(e) => setBusinessForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Managua, Nicaragua"
                    />
                  </div>

                  <Separator />

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Métodos de pago aceptados</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(m => {
                        const isSelected = businessForm.paymentMethods.includes(m.id)
                        return (
                          <div
                            key={m.id}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/40 hover:bg-muted/50"
                            }`}
                            onClick={() => togglePayment(m.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => togglePayment(m.id)}
                            />
                            <span className="text-lg">{m.icon}</span>
                            <span className="text-sm font-medium">{m.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <AnimatePresence>
                    {savedSuccess === "business" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Negocio guardado exitosamente
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
                    onClick={handleBusinessSave}
                    disabled={saving}
                    size="lg"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Guardar Negocio</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              SECTION 4: TikTok-Style Business Wall
          ═════════════════════════════════════════════════════════════════════ */}
          {isSeller && (
            <TabsContent value="wall" className="mt-4 space-y-4">
              {/* Create Post Header */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                      <DialogTrigger asChild>
                        <button className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm text-muted-foreground">
                          ¿Qué hay de nuevo en tu negocio?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-[#2E86C1]" /> Nueva publicación
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          {/* Content */}
                          <Textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            rows={3}
                            placeholder="Escribe algo sobre tu negocio, promociones, productos nuevos..."
                            className="resize-none"
                            autoFocus
                          />

                          {/* Image Preview */}
                          {newPostImage && (
                            <div className="relative rounded-lg overflow-hidden">
                              <img src={newPostImage} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                              <button
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                                onClick={() => { setNewPostImage(null); if (postType === "photo") setPostType("text") }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {/* Video Preview */}
                          {newPostVideo && (
                            <div className="relative rounded-lg overflow-hidden">
                              <video src={newPostVideo} controls className="w-full max-h-64 rounded-lg" />
                              <button
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                                onClick={() => { setNewPostVideo(null); if (postType === "video") setPostType("text") }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => postImageInputRef.current?.click()}
                            >
                              <ImagePlus className="h-4 w-4 mr-1" /> Foto
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              onClick={() => postVideoInputRef.current?.click()}
                            >
                              <Video className="h-4 w-4 mr-1" /> Video
                            </Button>
                            <input ref={postImageInputRef} type="file" accept="image/*" className="hidden" onChange={handlePostImageUpload} />
                            <input ref={postVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handlePostVideoUpload} />
                            <div className="flex-1" />
                            <Button
                              className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white"
                              onClick={handleCreatePost}
                              disabled={creatingPost || (!newPostContent.trim() && !newPostImage && !newPostVideo)}
                            >
                              {creatingPost ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Send className="h-4 w-4 mr-1" />
                              )}
                              Publicar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Wall Feed */}
              {loadingWall ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="border-0 shadow-md">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                        <div className="h-20 bg-muted animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : wallPosts.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Sin publicaciones aún</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      ¡Publica algo para que tus clientes te vean!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {wallPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="border-0 shadow-md overflow-hidden">
                          {/* Post Header */}
                          <CardContent className="p-4 pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={user?.avatar || undefined} />
                                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                    {user?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-sm">
                                    {user?.businessProfile?.businessName || user?.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {timeAgo(post.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Content Text */}
                            {post.content && (
                              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            )}
                          </CardContent>

                          {/* Image */}
                          {post.imageUrl && (
                            <div className="mx-4 mb-2 rounded-lg overflow-hidden">
                              <img
                                src={post.imageUrl}
                                alt="Post"
                                className="w-full max-h-96 object-cover"
                              />
                            </div>
                          )}

                          {/* Video */}
                          {post.videoUrl && (
                            <div className="mx-4 mb-2 rounded-lg overflow-hidden">
                              <video
                                src={post.videoUrl}
                                controls
                                className="w-full max-h-96"
                              />
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="px-4 py-2 flex items-center gap-1 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex-1 gap-1.5 ${likedPosts[post.id] ? "text-rose-500 hover:text-rose-600" : "text-muted-foreground hover:text-rose-500"}`}
                              onClick={() => handleLikePost(post.id)}
                            >
                              <Heart className={`h-4 w-4 ${likedPosts[post.id] ? "fill-current" : ""}`} />
                              <span className="text-xs font-medium">
                                {(post._count?.likes ?? 0) + (likedPosts[post.id] && !post.likes?.some(l => l.userId === user?.id) ? 1 : 0)}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 gap-1.5 text-muted-foreground hover:text-[#2E86C1]"
                              onClick={() => toggleComments(post.id)}
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">{post._count?.comments ?? 0}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 gap-1.5 text-muted-foreground hover:text-emerald-500"
                              onClick={() => {
                                navigator.clipboard?.writeText(`${window.location.origin}?wall=${post.id}`)
                                toast.success("Enlace copiado")
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                              <span className="text-xs font-medium">Compartir</span>
                            </Button>
                          </div>

                          {/* Expandable Comments Section */}
                          <AnimatePresence>
                            {expandedComments[post.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-border/50"
                              >
                                <div className="p-4 space-y-3">
                                  {/* Comments List */}
                                  <ScrollArea className="max-h-60">
                                    <div className="space-y-3">
                                      {(postComments[post.id] || []).map(comment => (
                                        <div key={comment.id} className="flex items-start gap-2">
                                          <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarImage src={comment.user?.avatar || undefined} />
                                            <AvatarFallback className="text-[10px]">
                                              {comment.user?.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="bg-muted/60 rounded-lg px-3 py-1.5">
                                              <p className="text-xs font-semibold">{comment.user?.name}</p>
                                              <p className="text-xs text-foreground/80">{comment.content}</p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                                              {timeAgo(comment.createdAt)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                      {(postComments[post.id] || []).length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                          Sin comentarios aún. ¡Sé el primero!
                                        </p>
                                      )}
                                    </div>
                                  </ScrollArea>

                                  {/* Comment Input */}
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7 shrink-0">
                                      <AvatarImage src={user?.avatar || undefined} />
                                      <AvatarFallback className="text-[10px]">
                                        {user?.name?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
                                      <Input
                                        value={commentInputs[post.id] || ""}
                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            submitComment(post.id)
                                          }
                                        }}
                                        placeholder="Escribe un comentario..."
                                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-6 text-xs px-0"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        disabled={!commentInputs[post.id]?.trim() || submittingComment[post.id]}
                                        onClick={() => submitComment(post.id)}
                                      >
                                        {submittingComment[post.id] ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Send className="h-3 w-3 text-[#2E86C1]" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              SECTION 5: User's Products Tab
          ═════════════════════════════════════════════════════════════════════ */}
          {isSeller && (
            <TabsContent value="products" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#2E86C1]" /> Mis Productos
                </h3>
                <Button
                  className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white"
                  size="sm"
                  onClick={() => navigate("sell-product")}
                >
                  <Plus className="h-4 w-4 mr-1" /> Nuevo
                </Button>
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="border-0 shadow-md">
                      <div className="h-40 bg-muted animate-pulse" />
                      <CardContent className="p-3 space-y-2">
                        <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Sin productos aún</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      ¡Publica tu primer producto para empezar a vender!
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white"
                      onClick={() => navigate("sell-product")}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Publicar Producto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {products.map((product, index) => {
                      const images = Array.isArray(product.images) ? product.images : []
                      const displayImage = images[0] || ""
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="border-0 shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
                            {/* Product Image */}
                            <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                              {displayImage ? (
                                <img
                                  src={displayImage}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Package className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                              )}
                              <Badge
                                className={`absolute top-2 left-2 text-[10px] ${
                                  product.status === "ACTIVE"
                                    ? "bg-emerald-500 text-white"
                                    : product.status === "PAUSED"
                                    ? "bg-amber-500 text-white"
                                    : "bg-red-500 text-white"
                                }`}
                              >
                                {product.status === "ACTIVE" ? "Activo" : product.status === "PAUSED" ? "Pausado" : product.status}
                              </Badge>
                            </div>
                            <CardContent className="p-3">
                              <h4 className="font-semibold text-sm line-clamp-1">{product.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                              <div className="flex items-center justify-between mt-2">
                                <div>
                                  {product.discountPrice ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-bold text-rose-500">
                                        {formatPrice(product.discountPrice)}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground line-through">
                                        {formatPrice(product.price)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm font-bold text-[#1A5276]">
                                      {formatPrice(product.price)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      navigate("edit-product", { editProductId: product.id })
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleDeleteProduct(product.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  )
}

'use client'

/**
 * Social Wall — Facebook-style Timeline
 * ProveedorConecta Nicaragua
 * 
 * Full multimedia sharing: upload/edit/delete posts, like, comment, share.
 * Media upload via Vercel Blob.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { authFetch } from '@/lib/client-auth'
import {
  Heart, MessageCircle, Share2, ImagePlus, Video, Send,
  MoreHorizontal, Pencil, Trash2, X, Loader2, Users,
  CheckCircle, MapPin, Globe, Lock, Smile, Camera,
} from 'lucide-react'

interface SocialPostData {
  id: string
  userId: string
  content: string
  images: string[]
  videoUrl: string
  postType: string
  isEdited: boolean
  createdAt: string
  updatedAt: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
  user: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
  }
  comments?: {
    id: string
    content: string
    createdAt: string
    user: { id: string; name: string; avatar: string }
  }[]
}

export function SocialWall({ profileUserId }: { profileUserId?: string }) {
  const { user } = useAuthStore()
  const { navigate } = useAppStore()
  const [posts, setPosts] = useState<SocialPostData[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (profileUserId) params.set('userId', profileUserId)
      const res = await authFetch(`/api/social/feed?${params.toString()}`)
      const data = await res.json()
      if (data.success) setPosts(data.data)
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setLoading(false)
    }
  }, [profileUserId])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }
    formData.append('subfolder', 'social-posts')

    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setUploadedImages(prev => [...prev, ...data.data.urls])
        toast.success(`${data.data.urls.length} imagen(es) subida(s)`)
      } else {
        toast.error(data.error || 'Error al subir')
      }
    } catch (err) {
      toast.error('Error al subir imágenes')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && uploadedImages.length === 0) return

    try {
      const res = await authFetch('/api/social/feed', {
        method: 'POST',
        body: JSON.stringify({
          content: newPostContent.trim(),
          images: uploadedImages,
          postType: uploadedImages.length > 0 ? 'photo' : 'text',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => [data.data, ...prev])
        setNewPostContent('')
        setUploadedImages([])
        toast.success('Publicado!')
      } else {
        toast.error(data.message || 'Error al publicar')
      }
    } catch (err) {
      toast.error('Error al crear publicación')
    }
  }

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await authFetch('/api/social/feed', {
        method: 'PUT',
        body: JSON.stringify({ postId, content: editContent.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent.trim(), isEdited: true } : p))
        setEditingPostId(null)
        toast.success('Publicación actualizada')
      }
    } catch (err) {
      toast.error('Error al editar')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return
    try {
      await authFetch(`/api/social/feed?id=${postId}`, { method: 'DELETE' })
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success('Publicación eliminada')
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const res = await authFetch('/api/social/interact', {
        method: 'POST',
        body: JSON.stringify({ action: 'like', postId }),
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, likedByMe: data.data.liked, likeCount: data.data.likeCount } : p
        ))
      }
    } catch (err) { /* ignore */ }
  }

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return
    try {
      const res = await authFetch('/api/social/interact', {
        method: 'POST',
        body: JSON.stringify({ action: 'comment', postId, content: commentText.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? {
            ...p,
            commentCount: data.data.commentCount,
            comments: [...(p.comments || []), data.data.comment],
          } : p
        ))
        setCommentText('')
        setCommentingPostId(null)
      }
    } catch (err) { /* ignore */ }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return d.toLocaleDateString('es-NI', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return <div className="space-y-4 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {profileUserId && profileUserId !== user?.id ? 'Publicaciones' : 'Mi Muro'}
        </h1>
        {profileUserId && (
          <Button variant="ghost" size="sm" onClick={() => navigate('social')}>
            <Users className="h-4 w-4 mr-1" /> Directorio
          </Button>
        )}
      </div>

      {/* Create Post (only on own wall) */}
      {(!profileUserId || profileUserId === user?.id) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar || ''} />
                <AvatarFallback>{(user?.name || 'U')[0]}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="¿Qué estás pensando?..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[60px] resize-none"
                rows={2}
              />
            </div>

            {/* Image previews */}
            {uploadedImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {uploadedImages.map((url, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg" />
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 p-0.5 bg-destructive text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">Foto/Video</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() && uploadedImages.length === 0}
              >
                <Send className="h-4 w-4 mr-1" /> Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto opacity-20 mb-3" />
          <p>No hay publicaciones aún</p>
          <p className="text-xs">¡Sé el primero en publicar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 cursor-pointer" onClick={() => navigate('vendor-profile', { vendorId: post.user.id })}>
                      <AvatarImage src={post.user.avatar} />
                      <AvatarFallback>{(post.user.name || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <button
                        onClick={() => navigate('vendor-profile', { vendorId: post.user.id })}
                        className="font-semibold text-sm hover:text-primary transition-colors"
                      >
                        {post.user.name}
                        {post.user.isVerified && <CheckCircle className="h-3.5 w-3.5 text-blue-500 inline ml-1" />}
                      </button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(post.createdAt)}</span>
                        {post.isEdited && <span>· Editado</span>}
                        <Globe className="h-3 w-3" />
                      </div>
                    </div>
                  </div>

                  {/* Post actions (own posts only) */}
                  {post.userId === user?.id && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingPostId(post.id); setEditContent(post.content) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                {editingPostId === post.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingPostId(null)}>Cancelar</Button>
                      <Button size="sm" onClick={() => handleEditPost(post.id)}>Guardar</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                )}

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-full rounded-lg object-cover max-h-80 cursor-pointer hover:opacity-95 transition-opacity"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                {/* Video */}
                {post.videoUrl && (
                  <video src={post.videoUrl} controls className="w-full rounded-lg max-h-80" />
                )}

                {/* Actions Bar */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${post.likedByMe ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                  >
                    <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
                    {post.likeCount > 0 && post.likeCount}
                  </button>

                  <button
                    onClick={() => { setCommentingPostId(commentingPostId === post.id ? null : post.id); setCommentText('') }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.commentCount > 0 && post.commentCount}
                  </button>

                  <button
                    onClick={() => {
                      const text = `Mira esta publicación de ${post.user.name} en ProveedorConecta: ${window.location.origin}/social`
                      if (navigator.share) {
                        navigator.share({ title: post.content.slice(0, 50), text, url: window.location.href })
                      } else {
                        navigator.clipboard.writeText(text)
                        toast.success('Enlace copiado!')
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
                  >
                    <Share2 className="h-4 w-4" /> Compartir
                  </button>
                </div>

                {/* Comment Input */}
                {commentingPostId === post.id && (
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Escribe un comentario..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    />
                    <Button size="sm" onClick={() => handleComment(post.id)} disabled={!commentText.trim()}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={comment.user.avatar} />
                          <AvatarFallback>{(comment.user.name || 'U')[0]}</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg px-3 py-1.5 text-sm">
                          <span className="font-semibold text-xs">{comment.user.name}</span>
                          <p className="text-xs">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

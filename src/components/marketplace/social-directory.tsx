'use client'

/**
 * Social User Directory — Red Social Estilo Facebook/Instagram
 * ProveedorConecta Nicaragua
 *
 * Búsqueda de usuarios por nombre, email o ID.
 * Ver perfil, seguir, iniciar chat, ver productos.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { authFetch } from '@/lib/client-auth'
import {
  Search, User, MessageCircle, UserPlus, UserCheck, Store,
  MapPin, Star, Shield, CheckCircle, X, Loader2, Users,
  ShoppingBag, Heart, Filter, ChevronDown, MoreHorizontal,
} from 'lucide-react'

interface SocialUser {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  department: string
  isVerified: boolean
  bio: string
  phone?: string
  displayName: string
  displayAvatar: string
  businessCategory?: string
  productCount: number
  followerCount: number
  followingCount: number
  businessProfile?: {
    businessName: string
    logo: string
    category: string
    description: string
  } | null
}

export function SocialDirectory() {
  const { user } = useAuthStore()
  const { navigate } = useAppStore()
  const [users, setUsers] = useState<SocialUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'sellers' | 'buyers'>('all')
  const [followingMap, setFollowingMap] = useState<Set<string>>(new Set())

  const fetchUsers = useCallback(async (query: string = '', type: string = 'all') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      params.set('type', type)
      params.set('limit', '30')
      const res = await authFetch(`/api/users/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(searchQuery, filterType)
  }, [searchQuery, filterType, fetchUsers])

  const handleStartChat = async (targetUser: SocialUser) => {
    try {
      const res = await authFetch('/api/chat/rooms', {
        method: 'POST',
        body: JSON.stringify({
          participantId: targetUser.id,
          message: `¡Hola ${targetUser.displayName}! 👋`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        navigate('chat', { roomId: data.data.id })
        toast.success(`Chat iniciado con ${targetUser.displayName}`)
      } else {
        toast.error(data.error || 'No se pudo iniciar el chat')
      }
    } catch (err) {
      toast.error('Error al iniciar chat')
    }
  }

  const handleFollow = async (targetId: string) => {
    try {
      const res = await authFetch('/api/follow', {
        method: 'POST',
        body: JSON.stringify({ followingId: targetId }),
      })
      const data = await res.json()
      if (data.success) {
        setFollowingMap(prev => {
          const next = new Set(prev)
          if (data.data.following) {
            next.add(targetId)
            toast.success('Siguiendo')
          } else {
            next.delete(targetId)
            toast.success('Dejaste de seguir')
          }
          return next
        })
      }
    } catch (err) {
      toast.error('Error al seguir usuario')
    }
  }

  const handleViewProfile = (targetUser: SocialUser) => {
    navigate('vendor-profile', { vendorId: targetUser.id })
  }

  if (loading && users.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Directorio Social
          </h1>
          <p className="text-sm text-muted-foreground">
            Encuentra proveedores, compradores y conecta con la comunidad
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(['all', 'sellers', 'buyers'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'Todos' : type === 'sellers' ? 'Vendedores' : 'Compradores'}
            </Button>
          ))}
        </div>
      </div>

      {/* User Grid */}
      {users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto opacity-20 mb-3" />
          <p>No se encontraron usuarios</p>
          {searchQuery && (
            <Button variant="link" onClick={() => setSearchQuery('')}>
              Limpiar búsqueda
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <Card key={u.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* Cover/Avatar */}
                <div className="flex items-start gap-3 mb-3">
                  <button onClick={() => handleViewProfile(u)} className="flex-shrink-0">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={u.displayAvatar} />
                      <AvatarFallback>{(u.displayName || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleViewProfile(u)}
                      className="font-semibold text-sm hover:text-primary transition-colors truncate block"
                    >
                      {u.displayName}
                      {u.isVerified && (
                        <CheckCircle className="h-3.5 w-3.5 text-blue-500 inline ml-1" />
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.name?.replace(/\s+/g, '').toLowerCase() || u.email.split('@')[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={u.role === 'SELLER' ? 'default' : 'secondary'} className="text-xs">
                        {u.role === 'SELLER' ? '🏪 Vendedor' : u.role === 'ADMIN' ? '🛡️ Admin' : '🛒 Comprador'}
                      </Badge>
                      {u.department && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {u.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {u.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{u.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span><strong>{u.productCount}</strong> productos</span>
                  <span><strong>{u.followerCount}</strong> seguidores</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleStartChat(u)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    Chat
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleFollow(u.id)}
                  >
                    {followingMap.has(u.id) ? (
                      <><UserCheck className="h-3.5 w-3.5 mr-1" /> Siguiendo</>
                    ) : (
                      <><UserPlus className="h-3.5 w-3.5 mr-1" /> Seguir</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewProfile(u)}
                  >
                    <Store className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

/**
 * Profile Settings Component
 * ProveedorConecta Nicaragua
 *
 * Allows users to update their profile information:
 * - Name, phone, address, bio, avatar, department
 * - Changes persist to Supabase via API
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  User, Phone, MapPin, Globe, FileText, Camera, Save,
  Loader2, CheckCircle2, Shield, Mail, Star,
} from 'lucide-react'

const NICARAGUA_DEPARTMENTS = [
  'Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí',
  'Granada', 'Jinotega', 'León', 'Madriz', 'Managua',
  'Masaya', 'Matagalpa', 'Nueva Segovia', 'Rivas',
  'Río San Juan', 'RAAN', 'RAAS',
]

export function ProfileSettings() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    bio: '',
    department: '',
    avatar: '',
    website: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        department: user.department || '',
        avatar: user.avatar || '',
        website: user.website || '',
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    // Client-side validation
    if (form.phone && !/^[578]\d{7}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      toast.error('Número de teléfono inválido. Debe ser un número nicaragüense de 8 dígitos.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          bio: form.bio,
          department: form.department,
          avatar: form.avatar,
          website: form.website,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setUser({ ...user, ...data.data })
        toast.success('Perfil actualizado exitosamente')
      } else {
        toast.error(data.error || data.message || 'Error al actualizar perfil')
      }
    } catch (err) {
      toast.error('Error de conexión al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuración de Perfil</h1>
        <p className="text-muted-foreground text-sm">
          Actualiza tu información personal. Estos cambios se guardan en tu cuenta.
        </p>
      </div>

      {/* Balance Card */}
      <Card className="border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo de Billetera</p>
              <p className="text-xl font-bold">
                C${(user.balance || 0).toFixed(2)} NIO
              </p>
            </div>
          </div>
          <Badge variant={user.balance > 0 ? 'default' : 'secondary'}>
            {user.balance > 0 ? 'Activo' : 'Sin fondos'}
          </Badge>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            {user.email} • {user.role === 'ADMIN' ? 'Administrador' : user.role === 'SELLER' ? 'Vendedor' : 'Comprador'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted overflow-hidden border-2 border-primary/20">
                {form.avatar ? (
                  <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <Label htmlFor="avatar-url">URL del Avatar</Label>
              <Input
                id="avatar-url"
                value={form.avatar}
                onChange={(e) => handleChange('avatar', e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg"
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Nombre Completo
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Teléfono
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+505 8888-7777"
            />
            <p className="text-xs text-muted-foreground">
              Formato nicaragüense: 8 dígitos comenzando con 5, 7 u 8
            </p>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department" className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Departamento
            </Label>
            <select
              id="department"
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">Seleccionar departamento</option>
              {NICARAGUA_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Dirección
            </Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Tu dirección física"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Sitio Web
            </Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://tuempresa.com"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Biografía
            </Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Cuéntanos sobre ti o tu negocio..."
              rows={4}
            />
          </div>

          {/* Verification Status */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${user.isVerified ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="text-sm">Verificado</span>
              {user.isVerified ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Badge variant="outline" className="text-xs">Pendiente</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Mail className={`h-4 w-4 ${user.emailVerified ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="text-sm">Email</span>
              {user.emailVerified ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Badge variant="outline" className="text-xs">Pendiente</Badge>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

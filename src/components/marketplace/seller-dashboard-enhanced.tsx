'use client'

/**
 * Enhanced Seller Dashboard with Recharts
 * ProveedorConecta Nicaragua
 *
 * Interactive dashboard showing:
 * - Daily/monthly earnings (gross sales, commissions, net profit)
 * - Bar chart & pie chart using Recharts
 * - Date range filtering
 * - Top-selling products
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Package, Users,
  Calendar, Download, RefreshCw, Filter, Star, Clock,
} from 'lucide-react'

interface DashboardStats {
  totalSales: number
  totalCommissions: number
  netProfit: number
  totalOrders: number
  totalProducts: number
  totalReviews: number
  averageRating: number
  dailyEarnings: { date: string; gross: number; commission: number; net: number }[]
  categoryBreakdown: { name: string; value: number; color: string }[]
  topProducts: { id: string; title: string; sales: number; revenue: number }[]
  recentTransactions: any[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4']
const CATEGORY_COLORS: Record<string, string> = {
  'Alimentos y Bebidas': '#FF6B6B',
  'Construcción y Ferretería': '#4ECDC4',
  'Agricultura y Ganadería': '#45B7D1',
  'Tecnología y Electrónica': '#96CEB4',
  'Textil y Calzado': '#FFEAA7',
  'Salud y Farmacia': '#DDA0DD',
  'Hogar y Muebles': '#98D8C8',
  'Educación y Oficina': '#F7DC6F',
  'Transporte y Logística': '#BB8FCE',
  'Servicios Profesionales': '#85C1E9',
  'Otros': '#CCCCCC',
}

export function SellerDashboardEnhanced() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [chartView, setChartView] = useState<'daily' | 'monthly'>('daily')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats/seller?range=${dateRange}&view=${chartView}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange, chartView])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatNIO = (amount: number) =>
    new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(amount)

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Package className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">No hay datos disponibles</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Vendedor</h1>
          <p className="text-muted-foreground text-sm">
            {user?.businessProfile?.businessName || user?.name || 'Mi Negocio'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range filter */}
          <div className="flex rounded-lg border overflow-hidden">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {range === 'all' ? 'Todo' : range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ventas Brutas</p>
                <p className="text-xl font-bold text-green-600">{formatNIO(stats.totalSales)}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Comisiones (3%)</p>
                <p className="text-xl font-bold text-amber-600">{formatNIO(stats.totalCommissions)}</p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ganancia Neta</p>
                <p className="text-xl font-bold text-primary">{formatNIO(stats.netProfit)}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Órdenes</p>
                <p className="text-xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {chartView === 'daily' ? 'Ganancias Diarias' : 'Ganancias Mensuales'}
            </CardTitle>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setChartView('daily')}
                className={`px-2 py-1 text-xs font-medium ${
                  chartView === 'daily' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                Diario
              </button>
              <button
                onClick={() => setChartView('monthly')}
                className={`px-2 py-1 text-xs font-medium ${
                  chartView === 'monthly' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                Mensual
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyEarnings} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => formatNIO(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="gross" name="Bruto" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commission" name="Comisión 3%" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Neto" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col lg:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {stats.categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatNIO(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Productos Más Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay ventas aún</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sales} ventas
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {formatNIO(product.revenue)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-xs text-muted-foreground">Productos Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Calificación Promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{stats.totalReviews}</p>
            <p className="text-xs text-muted-foreground">Reseñas Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{dateRange === 'all' ? '∞' : dateRange}</p>
            <p className="text-xs text-muted-foreground">Período</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

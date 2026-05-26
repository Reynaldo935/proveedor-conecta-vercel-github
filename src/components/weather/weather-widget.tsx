"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Droplets, Thermometer, Wind } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface WeatherData {
  city: string
  current: {
    temp: number
    humidity: number
    condition: string
    icon: string
  }
  forecast: {
    date: string
    max: number
    min: number
    condition: string
    icon: string
  }[]
}

const NICARAGUA_CITIES = [
  "Managua",
  "León",
  "Granada",
  "Matagalpa",
  "Estelí",
  "Chinandega",
  "Masaya",
  "Bluefields",
]

const CACHE_KEY = "pc_weather_cache"
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

interface CachedWeather {
  data: WeatherData
  timestamp: number
}

function getCachedWeather(city: string): WeatherData | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${city.toLowerCase()}`)
    if (!raw) return null
    const cached: CachedWeather = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_KEY}_${city.toLowerCase()}`)
      return null
    }
    return cached.data
  } catch {
    return null
  }
}

function setCachedWeather(city: string, data: WeatherData) {
  try {
    localStorage.setItem(
      `${CACHE_KEY}_${city.toLowerCase()}`,
      JSON.stringify({ data, timestamp: Date.now() })
    )
  } catch {
    // localStorage not available
  }
}

function detectNearestCity(lat: number, lon: number): string {
  const cities: Record<string, { lat: number; lon: number }> = {
    Managua: { lat: 12.1364, lon: -86.2514 },
    León: { lat: 12.4375, lon: -86.8833 },
    Granada: { lat: 11.9344, lon: -85.956 },
    Matagalpa: { lat: 12.9256, lon: -85.9175 },
    Estelí: { lat: 13.0939, lon: -86.3552 },
    Chinandega: { lat: 13.2878, lon: -87.1444 },
    Masaya: { lat: 11.9744, lon: -86.0947 },
    Bluefields: { lat: 12.0054, lon: -83.7736 },
  }

  let nearest = "Managua"
  let minDist = Infinity

  for (const [name, coords] of Object.entries(cities)) {
    const dist = Math.sqrt(
      Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2)
    )
    if (dist < minDist) {
      minDist = dist
      nearest = name
    }
  }

  return nearest
}

function formatForecastDay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  return days[date.getDay()]
}

export function WeatherWidget() {
  const [city, setCity] = useState("Managua")
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect location on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nearest = detectNearestCity(pos.coords.latitude, pos.coords.longitude)
          setCity(nearest)
        },
        () => {
          // Location denied, keep default Managua
        },
        { timeout: 5000 }
      )
    }
  }, [])

  const fetchWeather = useCallback(async (cityName: string) => {
    // Check cache first
    const cached = getCachedWeather(cityName)
    if (cached) {
      setWeather(cached)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`)
      const data = await res.json()

      if (data.success) {
        setWeather(data.data)
        setCachedWeather(cityName, data.data)
      } else {
        setError(data.error || "Error al obtener clima")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather(city)
  }, [city, fetchWeather])

  const handleCityChange = (value: string) => {
    setCity(value)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ) : error ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              <span>🌤️</span> {error}
            </div>
          ) : weather ? (
            <div className="space-y-3">
              {/* Current weather */}
              <div className="flex items-center gap-3">
                <div className="text-3xl">{weather.current.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <Select value={city} onValueChange={handleCityChange}>
                      <SelectTrigger className="h-7 w-auto min-w-[100px] border-0 p-0 text-sm font-semibold focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NICARAGUA_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl font-bold" style={{ color: "#1A5276" }}>
                      {Math.round(weather.current.temp)}°C
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {weather.current.condition}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    <span>{weather.current.humidity}%</span>
                  </div>
                </div>
              </div>

              {/* 3-day forecast strip */}
              {weather.forecast && weather.forecast.length > 0 && (
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  {weather.forecast.map((day) => (
                    <div
                      key={day.date}
                      className="flex-1 text-center bg-muted/50 rounded-lg py-1.5 px-1"
                    >
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {formatForecastDay(day.date)}
                      </p>
                      <p className="text-sm">{day.icon}</p>
                      <div className="flex items-center justify-center gap-1 text-[10px]">
                        <span className="font-semibold">{Math.round(day.max)}°</span>
                        <span className="text-muted-foreground">{Math.round(day.min)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}

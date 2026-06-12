/**
 * Weather API Route
 * GET /api/weather?city=Managua
 *
 * Uses the real Open-Meteo API (free, no API key needed).
 * Falls back to hardcoded data if the API call fails.
 */

import { NextRequest, NextResponse } from 'next/server'

const CITY_COORDINATES: Record<string, { lat: number; lon: number; fallbackTemp: number; fallbackHumidity: number; fallbackCode: number; display: string }> = {
  managua: { lat: 12.1364, lon: -86.2514, fallbackTemp: 31, fallbackHumidity: 65, fallbackCode: 2, display: 'Managua' },
  leon: { lat: 12.4375, lon: -86.8833, fallbackTemp: 33, fallbackHumidity: 60, fallbackCode: 1, display: 'León' },
  granada: { lat: 11.9344, lon: -85.956, fallbackTemp: 32, fallbackHumidity: 62, fallbackCode: 2, display: 'Granada' },
  matagalpa: { lat: 12.9256, lon: -85.9175, fallbackTemp: 25, fallbackHumidity: 75, fallbackCode: 3, display: 'Matagalpa' },
  esteli: { lat: 13.0939, lon: -86.3552, fallbackTemp: 27, fallbackHumidity: 70, fallbackCode: 2, display: 'Estelí' },
  chinandega: { lat: 13.2878, lon: -87.1444, fallbackTemp: 34, fallbackHumidity: 58, fallbackCode: 1, display: 'Chinandega' },
  masaya: { lat: 11.9744, lon: -86.0947, fallbackTemp: 30, fallbackHumidity: 66, fallbackCode: 2, display: 'Masaya' },
  bluefields: { lat: 12.0054, lon: -83.7736, fallbackTemp: 29, fallbackHumidity: 82, fallbackCode: 51, display: 'Bluefields' },
}

function getWeatherCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Despejado', icon: '☀️' }
  if (code === 1) return { condition: 'Principalmente despejado', icon: '🌤️' }
  if (code === 2) return { condition: 'Parcialmente nublado', icon: '⛅' }
  if (code === 3) return { condition: 'Nublado', icon: '☁️' }
  if (code >= 45 && code <= 48) return { condition: 'Niebla', icon: '🌫️' }
  if (code >= 51 && code <= 55) return { condition: 'Llovizna', icon: '🌦️' }
  if (code >= 56 && code <= 57) return { condition: 'Llovizna helada', icon: '🌧️' }
  if (code >= 61 && code <= 65) return { condition: 'Lluvia', icon: '🌧️' }
  if (code >= 66 && code <= 67) return { condition: 'Lluvia helada', icon: '🌧️' }
  if (code >= 71 && code <= 77) return { condition: 'Nieve', icon: '❄️' }
  if (code >= 80 && code <= 82) return { condition: 'Chubascos', icon: '🌦️' }
  if (code >= 85 && code <= 86) return { condition: 'Chubascos de nieve', icon: '🌨️' }
  if (code === 95) return { condition: 'Tormenta', icon: '⛈️' }
  if (code >= 96 && code <= 99) return { condition: 'Tormenta con granizo', icon: '⛈️' }
  return { condition: 'Desconocido', icon: '🌤️' }
}

/**
 * Build the fallback response from hardcoded data (same format as original)
 */
function buildFallbackResponse(cityKey: string) {
  const city = CITY_COORDINATES[cityKey] || CITY_COORDINATES['managua']
  const cond = getWeatherCondition(city.fallbackCode)
  const hour = new Date().getHours()
  const tempVariation = hour >= 12 ? 2 : -1
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const day3 = new Date(Date.now() + 172800000).toISOString().split('T')[0]

  return {
    city: city.display,
    current: {
      temp: city.fallbackTemp + tempVariation,
      humidity: city.fallbackHumidity,
      condition: cond.condition,
      icon: cond.icon,
    },
    forecast: [
      { date: today, max: city.fallbackTemp + 3, min: city.fallbackTemp - 5, condition: cond.condition, icon: cond.icon },
      { date: tomorrow, max: city.fallbackTemp + 1, min: city.fallbackTemp - 4, condition: 'Parcialmente nublado', icon: '⛅' },
      { date: day3, max: city.fallbackTemp + 4, min: city.fallbackTemp - 3, condition: 'Soleado', icon: '☀️' },
    ],
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityParam = (searchParams.get('city') || 'Managua').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const city = CITY_COORDINATES[cityParam] || CITY_COORDINATES['managua']

    // Try fetching real data from Open-Meteo API
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=America/Managua&forecast_days=3`

      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (response.ok) {
        const data = await response.json()

        // Parse Open-Meteo response
        const currentTemp = data.current?.temperature_2m
        const currentHumidity = data.current?.relative_humidity_2m
        const currentCode = data.current?.weather_code

        const dailyMax = data.daily?.temperature_2m_max as number[] | undefined
        const dailyMin = data.daily?.temperature_2m_min as number[] | undefined
        const dailyCodes = data.daily?.weather_code as number[] | undefined
        const dailyDates = data.daily?.time as string[] | undefined

        if (
          typeof currentTemp === 'number' &&
          typeof currentHumidity === 'number' &&
          typeof currentCode === 'number' &&
          Array.isArray(dailyMax) &&
          Array.isArray(dailyMin) &&
          Array.isArray(dailyCodes) &&
          Array.isArray(dailyDates)
        ) {
          const currentCondition = getWeatherCondition(currentCode)

          const forecast = dailyDates.slice(0, 3).map((date, i) => {
            const condition = getWeatherCondition(dailyCodes[i])
            return {
              date,
              max: Math.round(dailyMax[i]),
              min: Math.round(dailyMin[i]),
              condition: condition.condition,
              icon: condition.icon,
            }
          })

          return NextResponse.json({
            success: true,
            data: {
              city: city.display,
              current: {
                temp: Math.round(currentTemp),
                humidity: currentHumidity,
                condition: currentCondition.condition,
                icon: currentCondition.icon,
              },
              forecast,
              source: 'open-meteo',
            },
          })
        }
      }

      // If we get here, the API response was not parseable — fall back
      console.warn('[Weather API] Open-Meteo response invalid, using fallback data')
    } catch (fetchError) {
      console.warn('[Weather API] Open-Meteo fetch failed, using fallback data:', fetchError instanceof Error ? fetchError.message : fetchError)
    }

    // Fallback to hardcoded data
    return NextResponse.json({
      success: true,
      data: {
        ...buildFallbackResponse(cityParam),
        source: 'fallback',
      },
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos del clima' },
      { status: 500 }
    )
  }
}

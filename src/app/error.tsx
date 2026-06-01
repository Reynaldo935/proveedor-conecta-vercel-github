"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Only log in development — avoid polluting production consoles
    if (process.env.NODE_ENV === "development") {
      console.error("App error:", error)
    }
  }, [error])

  const isChunkError =
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("dynamically imported module") ||
    error?.message?.includes("Failed to fetch dynamically imported module")

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {isChunkError ? "Error de carga" : "Algo salió mal"}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {isChunkError
                ? "No se pudo cargar un recurso de la aplicación. Esto suele resolverse recargando la página."
                : "Ha ocurrido un error inesperado. Por favor intenta de nuevo."}
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <Button
              variant="outline"
              onClick={reset}
              className="gap-1.5 rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
            <Button
              onClick={() => { window.location.href = "/" }}
              className="gap-1.5 rounded-xl"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

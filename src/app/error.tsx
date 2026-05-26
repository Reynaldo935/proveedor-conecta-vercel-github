"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="text-6xl">😕</div>
      <h2 className="text-2xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Ha ocurrido un error inesperado. Por favor intenta de nuevo.
      </p>
      <Button onClick={reset} className="rounded-xl">
        Intentar de nuevo
      </Button>
    </div>
  )
}

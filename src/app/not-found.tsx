"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Página no encontrada</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              La página que buscas no existe o ha sido movida.
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-1.5 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
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

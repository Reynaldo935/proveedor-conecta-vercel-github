"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  /** Optional view name for better error messages */
  viewName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary that wraps dynamically loaded view components.
 * Catches rendering errors, dynamic import failures, and any
 * runtime errors from child components, showing a graceful
 * fallback UI instead of crashing the whole page.
 */
export class ViewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development to avoid polluting production consoles
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[ViewErrorBoundary${this.props.viewName ? ` - ${this.props.viewName}` : ""}]`,
        error,
        errorInfo
      )
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    // Use a full page reload to reset all state cleanly
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Loading chunk") ||
        this.state.error?.message?.includes("dynamically imported module") ||
        this.state.error?.message?.includes("Failed to fetch dynamically imported module")

      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <Card className="max-w-md w-full border-destructive/20">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">
                  {isChunkError ? "Error de carga" : "Algo salió mal"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {isChunkError
                    ? "No se pudo cargar esta sección. Esto puede deberse a una conexión inestable o a una actualización de la aplicación."
                    : "Ha ocurrido un error inesperado en esta sección. Puedes intentar recargar o volver al inicio."}
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reintentar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={this.handleGoHome}
                >
                  Ir al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

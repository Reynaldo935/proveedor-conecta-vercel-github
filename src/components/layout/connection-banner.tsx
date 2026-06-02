"use client"

import { useState, useEffect } from "react"
import { WifiOff, RefreshCw } from "lucide-react"
import { isServerOffline, onServerOfflineChange } from "@/components/layout/fetch-interceptor"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Shows a banner at the top of the page when the server is unreachable.
 * Includes a retry button that reloads the page.
 */
export function ConnectionBanner() {
  const [offline, setOffline] = useState(() => isServerOffline())

  useEffect(() => {
    return onServerOfflineChange((val) => setOffline(val))
  }, [])

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-destructive/90 text-destructive-foreground px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Sin conexión al servidor — reintentando automáticamente...</span>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              Recargar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

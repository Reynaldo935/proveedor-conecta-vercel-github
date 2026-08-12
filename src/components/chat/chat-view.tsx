"use client"

import { useState } from "react"
import { useAppStore } from "@/store/app-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, MessageCircle, ExternalLink, Phone, Users } from "lucide-react"
import { motion } from "framer-motion"

const WHATSAPP_WEB_URL = "https://web.whatsapp.com/"

export function ChatView() {
  const { navigate } = useAppStore()
  const [showIframe, setShowIframe] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with back button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" /> Chat via WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            Comunicate directamente con proveedores y compradores usando WhatsApp Web
          </p>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* WhatsApp Logo */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="white">
                    <path d="M24 4C12.95 4 4 12.95 4 24c0 3.53.92 6.99 2.67 10.02L4 44l10.33-2.61A19.91 19.91 0 0024 44c11.05 0 20-8.95 20-20S35.05 4 24 4zm0 36.8c-3.21 0-6.36-.85-9.13-2.45l-.65-.39-6.13 1.55 1.64-5.98-.42-.67A15.95 15.95 0 018 24c0-8.84 7.16-16 16-16s16 7.16 16 16-7.16 16-16 16z"/>
                    <path d="M34.11 28.32c-.39-.2-2.3-1.13-2.66-1.26-.36-.13-.62-.2-.88.2-.26.39-1.01 1.26-1.24 1.52-.23.26-.46.29-.85.1-.39-.2-1.66-.61-3.16-1.95-1.17-1.04-1.96-2.33-2.19-2.72-.23-.39-.02-.6.17-.8.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.13-1.21-2.92-.32-.76-.64-.66-.88-.67-.23-.01-.49-.01-.75-.01s-.69.1-1.05.49c-.36.39-1.38 1.35-1.38 3.29s1.41 3.82 1.61 4.08c.2.26 2.78 4.24 6.73 5.95.94.41 1.68.65 2.25.83.95.3 1.81.26 2.49.16.76-.11 2.3-.94 2.62-1.85.33-.91.33-1.69.23-1.85-.1-.16-.36-.26-.75-.46z"/>
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-green-700 dark:text-green-400">WhatsApp Web</h2>
                <p className="text-sm mt-2 text-muted-foreground leading-relaxed">
                  Usa WhatsApp Web para chatear con proveedores y compradores de forma rapida y segura. 
                  Escanea el codigo QR con tu telefono para iniciar sesion.
                </p>
                
                <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md"
                    onClick={() => setShowIframe(!showIframe)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {showIframe ? "Ocultar WhatsApp" : "Abrir WhatsApp Web"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open("https://wa.me/505", "_blank")}
                  >
                    <Phone className="h-4 w-4" />
                    Abrir en App
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("chat-list")}
                  >
                    <Users className="h-4 w-4" />
                    Ver conversaciones
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* WhatsApp Web Iframe */}
      {showIframe && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <Card className="border-2 border-green-300 dark:border-green-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <svg viewBox="0 0 48 48" className="w-5 h-5" fill="#25D366">
                    <path d="M24 4C12.95 4 4 12.95 4 24c0 3.53.92 6.99 2.67 10.02L4 44l10.33-2.61A19.91 19.91 0 0024 44c11.05 0 20-8.95 20-20S35.05 4 24 4z"/>
                  </svg>
                  WhatsApp Web
                </CardTitle>
                <Badge variant="outline" className="text-xs gap-1">
                  <ExternalLink className="h-3 w-3" /> 
                  <a href={WHATSAPP_WEB_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Abrir en nueva pestana
                  </a>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={WHATSAPP_WEB_URL}
                className="w-full rounded-b-lg"
                style={{ height: "70vh", minHeight: "500px", border: "none" }}
                title="WhatsApp Web"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                loading="lazy"
              />
              <p className="text-[10px] text-muted-foreground text-center p-2 bg-muted/30">
                * WhatsApp Web se carga en un iframe. Si no funciona, usa el boton "Abrir en nueva pestana" arriba.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alternative: Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Enlaces rapidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
                onClick={() => window.open("https://web.whatsapp.com/", "_blank")}
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5" fill="#25D366">
                  <path d="M24 4C12.95 4 4 12.95 4 24c0 3.53.92 6.99 2.67 10.02L4 44l10.33-2.61A19.91 19.91 0 0024 44c11.05 0 20-8.95 20-20S35.05 4 24 4z"/>
                </svg>
                WhatsApp Web
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
                onClick={() => window.open("https://wa.me/505", "_blank")}
              >
                <Phone className="h-5 w-5 text-green-600" />
                Abrir WhatsApp App
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
                onClick={() => window.open("https://t.me/", "_blank")}
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5" fill="#0088CC">
                  <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm9.45 13.66l-3.12 14.72c-.24 1.04-.85 1.3-1.72.81l-4.76-3.5-2.3 2.21c-.25.25-.46.46-.95.46l.34-4.84 8.82-7.97c.38-.34-.08-.53-.59-.19l-10.9 6.86-4.7-1.47c-1.02-.32-1.04-1.02.21-1.51l18.39-7.08c.85-.32 1.6.21 1.32 1.51z"/>
                </svg>
                Telegram (Alternativa)
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
                onClick={() => navigate("chat-list")}
              >
                <Users className="h-5 w-5 text-primary" />
                Chats de ProveedorConecta
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-xs text-muted-foreground">
          Usa WhatsApp Web para una comunicacion rapida y confiable. 
          La plataforma de chat integrada sigue disponible para mensajeria dentro de la app.
        </p>
      </motion.div>
    </div>
  )
}

"use client"

import { useCreators } from "@/hooks/useCreators"
import { useAuthStore } from "@/store/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Users, RefreshCw, Mail } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CreatorsDropdown() {
  const { creators, loading, refreshCreators } = useCreators()
  const { user } = useAuthStore()
  const isAdmin = user?.email === "rey7214935@gmail.com"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Users className="h-4 w-4" />
          <span className="hidden lg:inline">Team</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] sm:w-[540px] p-4 z-50" align="end" sideOffset={8}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm font-[family-name:var(--font-poppins)]">
              Nuestro Equipo
            </h3>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{creators.length} miembros</Badge>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshCreators} title="Actualizar datos del equipo">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-3">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-3 w-16 mt-2" />
                <Skeleton className="h-2 w-12 mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <AnimatePresence>
              {creators.map((creator, index) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.06, duration: 0.25 }}
                  className="flex flex-col items-center p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all cursor-default group hover:shadow-sm"
                >
                  <Avatar className="h-16 w-16 border-2 shadow-sm" style={{ borderColor: creator.color }}>
                    {creator.photo ? (
                      <img 
                        src={creator.photo} 
                        alt={creator.name} 
                        className="h-full w-full object-cover rounded-full" 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
                      />
                    ) : null}
                    <AvatarFallback
                      className="text-white font-bold text-lg"
                      style={{ backgroundColor: creator.color }}
                    >
                      {creator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-xs mt-2 font-[family-name:var(--font-poppins)] text-center leading-tight">
                    {creator.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 mt-1 leading-tight font-medium"
                    style={{ backgroundColor: `${creator.color}18`, color: creator.color, borderColor: `${creator.color}30` }}
                  >
                    {creator.role}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground text-center mt-1.5 leading-tight opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                    {creator.bio}
                  </p>
                  {creator.email && (
                    <a 
                      href={`mailto:${creator.email}`}
                      className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-3 w-3 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-3 pt-3 border-t text-center">
          <p className="text-[10px] text-muted-foreground">
            🇳🇮 Hecho con ❤️ en Nicaragua
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5 opacity-60">
            Datos actualizados cada 30 min
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

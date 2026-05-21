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
        <Button variant="ghost" size="sm" className="gap-1">
          <Users className="h-4 w-4" />
          <span className="hidden lg:inline">Team</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] sm:w-[480px] p-3 z-50" align="end" sideOffset={8}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm font-[family-name:var(--font-poppins)]">
              Nuestro Equipo
            </h3>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshCreators} title="Actualizar datos">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-2">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-3 w-16 mt-2" />
                <Skeleton className="h-2 w-12 mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AnimatePresence>
              {creators.map((creator, index) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="flex flex-col items-center p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-default group"
                >
                  <Avatar className="h-14 w-14 border-2" style={{ borderColor: creator.color }}>
                    {creator.photo ? (
                      <img src={creator.photo} alt={creator.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback
                        className="text-white font-bold text-lg"
                        style={{ backgroundColor: creator.color }}
                      >
                        {creator.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-semibold text-xs mt-2 font-[family-name:var(--font-poppins)] text-center leading-tight">
                    {creator.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 mt-1 leading-tight"
                    style={{ backgroundColor: `${creator.color}15`, color: creator.color }}
                  >
                    {creator.role}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground text-center mt-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                    {creator.bio.length > 50 ? creator.bio.substring(0, 50) + "..." : creator.bio}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-2 pt-2 border-t text-center">
          <p className="text-[10px] text-muted-foreground">
            🇳🇮 Hecho con ❤️ en Nicaragua
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

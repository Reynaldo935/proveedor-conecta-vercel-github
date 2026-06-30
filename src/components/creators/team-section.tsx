"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Code2,
  Palette,
  Megaphone,
  MessageSquare,
  Globe,
} from "lucide-react"

// EQUIPO data - 5 creators
const TEAM_MEMBERS = [
  {
    name: "Reynaldo",
    role: "Full-Stack Developer",
    description: "Arquitecto de software y desarrollador principal del marketplace.",
    photo: "/equipo/Reynaldo.jpeg",
    icon: Code2,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    name: "Apolonio",
    role: "Frontend Developer",
    description: "Especialista en interfaces de usuario y experiencia de navegación.",
    photo: "/equipo/Apolonio.jpeg",
    icon: Globe,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    name: "Sarahí",
    role: "Graphic Designer",
    description: "Diseñadora visual, creadora de la identidad de marca y paleta de colores.",
    photo: "/uploads/equipo/Sarahi.jpeg",
    icon: Palette,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    name: "Pedro",
    role: "Communicator",
    description: "Estratega de comunicación y relaciones públicas del proyecto.",
    photo: "/uploads/equipo/Pedro.jpeg",
    icon: MessageSquare,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    name: "Mychael",
    role: "Marketing",
    description: "Especialista en marketing digital y crecimiento del marketplace.",
    photo: "/uploads/equipo/Mychael.jpeg",
    icon: Megaphone,
    color: "text-rose-500",
    bg: "bg-rose-100 dark:bg-rose-900/30",
  },
]

export function TeamSectionMenu() {
  return (
    <div className="space-y-2">
      {TEAM_MEMBERS.map((member) => (
        <div
          key={member.name}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default"
        >
          <Avatar className="h-10 w-10 border-2 border-[#D2B48C] dark:border-[#D4A017]">
            <AvatarImage src={member.photo} alt={member.name} />
            <AvatarFallback className={`${member.bg} ${member.color}`}>
              {member.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TeamPageSection() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-2xl bg-[#D2B48C] dark:bg-[#D4A017] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white font-bold text-3xl">PC</span>
        </div>
        <h1 className="text-3xl font-bold text-[#4A90E2] dark:text-[#D4A017] font-[family-name:var(--font-poppins)]">
          Nuestro Equipo
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Conoce a los creadores detrás de ProveedorConecta Nicaragua, el marketplace que conecta proveedores y compradores.
        </p>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEAM_MEMBERS.map((member) => {
          const Icon = member.icon
          return (
            <div
              key={member.name}
              className="group relative bg-card rounded-2xl border p-6 text-center hover:shadow-lg hover:border-[#D2B48C] dark:hover:border-[#D4A017] transition-all duration-300"
            >
              {/* Avatar */}
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Avatar className="w-24 h-24 border-3 border-[#D2B48C] dark:border-[#D4A017] shadow-md">
                  <AvatarImage src={member.photo} alt={member.name} />
                  <AvatarFallback className={`text-2xl ${member.bg} ${member.color}`}>
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${member.bg} flex items-center justify-center shadow`}>
                  <Icon className={`h-4 w-4 ${member.color}`} />
                </div>
              </div>

              {/* Info */}
              <h3 className="text-lg font-semibold text-[#607D8B] dark:text-[#D5DDE5]">
                {member.name}
              </h3>
              <p className={`text-sm font-medium ${member.color} mb-2`}>
                {member.role}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {member.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Footer Note */}
      <div className="text-center mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#4A90E2]/10 to-[#D2B48C]/10 dark:from-[#4A90E2]/20 dark:to-[#D4A017]/20">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-[#4A90E2] dark:text-[#D4A017]">ProveedorConecta Nicaragua</span> — 
          Construido con pasión por un equipo multidisciplinario de profesionales nicaragüenses.
        </p>
      </div>
    </div>
  )
}

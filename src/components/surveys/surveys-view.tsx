"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  Plus,
  Vote,
  Clock,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SurveyOption {
  id: string
  text: string
}

interface SurveyQuestion {
  id: string
  text: string
  type: "single" | "multiple"
  options: SurveyOption[]
}

interface SurveyResponse {
  questionId: string
  selectedOptions: string[]
}

interface Survey {
  id: string
  title: string
  description: string
  questions: SurveyQuestion[]
  responses: Record<string, string[]> // userId -> array of optionIds
  questionResults: Record<string, Record<string, number>> // questionId -> { optionId: count }
  createdBy: string
  createdByName: string
  createdAt: string
  isActive: boolean
  totalResponses: number
}

// ─── Local Storage helpers ──────────────────────────────────────────────────────

const SURVEYS_KEY = "pc_surveys"

function loadSurveys(): Survey[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SURVEYS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSurveys(surveys: Survey[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys))
  } catch {
    // storage full or unavailable
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function BarChartResult({ optionText, count, total, color }: { optionText: string; count: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate mr-2">{optionText}</span>
        <span className="text-muted-foreground whitespace-nowrap">
          {count} voto{count !== 1 ? "s" : ""} ({percent}%)
        </span>
      </div>
      <div className="relative h-7 w-full rounded-md bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-md transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {percent > 0 ? `${percent}%` : ""}
        </span>
      </div>
    </div>
  )
}

function SurveyResults({ survey }: { survey: Survey }) {
  const totalVoters = survey.totalResponses
  return (
    <div className="space-y-6">
      {survey.questions.map((question, qi) => {
        const results = survey.questionResults[question.id] || {}
        const questionTotal = Object.values(results).reduce((a, b) => a + b, 0)
        const colors = [
          "bg-primary/70",
          "bg-emerald-500/70",
          "bg-amber-500/70",
          "bg-rose-500/70",
          "bg-cyan-500/70",
          "bg-violet-500/70",
        ]
        return (
          <div key={question.id} className="space-y-3">
            <h4 className="font-semibold text-sm">
              {qi + 1}. {question.text}
            </h4>
            <div className="space-y-2">
              {question.options.map((opt, oi) => (
                <BarChartResult
                  key={opt.id}
                  optionText={opt.text}
                  count={results[opt.id] || 0}
                  total={questionTotal}
                  color={colors[oi % colors.length]}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {questionTotal} respuesta{questionTotal !== 1 ? "s" : ""} para esta pregunta
            </p>
          </div>
        )
      })}
      <Separator />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{totalVoters} participante{totalVoters !== 1 ? "s" : ""} en total</span>
      </div>
    </div>
  )
}

function SurveyVoter({
  survey,
  onSubmit,
}: {
  survey: Survey
  onSubmit: (responses: SurveyResponse[]) => void
}) {
  const [responses, setResponses] = useState<SurveyResponse[]>(() =>
    survey.questions.map((q) => ({ questionId: q.id, selectedOptions: [] }))
  )
  const [submitting, setSubmitting] = useState(false)

  const toggleOption = (questionId: string, optionId: string, type: "single" | "multiple") => {
    setResponses((prev) =>
      prev.map((r) => {
        if (r.questionId !== questionId) return r
        if (type === "single") {
          return { ...r, selectedOptions: [optionId] }
        }
        const has = r.selectedOptions.includes(optionId)
        return {
          ...r,
          selectedOptions: has
            ? r.selectedOptions.filter((o) => o !== optionId)
            : [...r.selectedOptions, optionId],
        }
      })
    )
  }

  const allAnswered = responses.every(
    (r) => r.selectedOptions.length > 0
  )

  const handleSubmit = async () => {
    if (!allAnswered) return
    setSubmitting(true)
    // Simulate a small delay
    await new Promise((r) => setTimeout(r, 300))
    onSubmit(responses)
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {survey.questions.map((question, qi) => {
        const current = responses.find((r) => r.questionId === question.id)
        const selected = current?.selectedOptions || []
        return (
          <div key={question.id} className="space-y-3">
            <h4 className="font-semibold text-sm">
              {qi + 1}. {question.text}
              {question.type === "multiple" && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Múltiple
                </Badge>
              )}
            </h4>
            <div className="space-y-2">
              {question.options.map((opt) => {
                const isSelected = selected.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleOption(question.id, opt.id, question.type)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-medium">{opt.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      <Button
        className="w-full"
        disabled={!allAnswered || submitting}
        onClick={handleSubmit}
      >
        {submitting ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Enviando...
          </>
        ) : (
          <>
            <Vote className="h-4 w-4 mr-2" /> Enviar Respuestas
          </>
        )}
      </Button>
      {!allAnswered && (
        <p className="text-xs text-muted-foreground text-center">
          Responde todas las preguntas para enviar
        </p>
      )}
    </div>
  )
}

// ─── Create Survey Form ─────────────────────────────────────────────────────────

function CreateSurveyForm({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (survey: Survey) => void
}) {
  const { user } = useAuthStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    {
      id: generateId(),
      text: "",
      type: "single",
      options: [
        { id: generateId(), text: "" },
        { id: generateId(), text: "" },
      ],
    },
  ])

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        text: "",
        type: "single",
        options: [
          { id: generateId(), text: "" },
          { id: generateId(), text: "" },
        ],
      },
    ])
  }

  const removeQuestion = (questionId: string) => {
    if (questions.length <= 1) {
      toast.error("Debe haber al menos una pregunta")
      return
    }
    setQuestions((prev) => prev.filter((q) => q.id !== questionId))
  }

  const updateQuestion = (questionId: string, field: "text" | "type", value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    )
  }

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        if (q.options.length >= 10) {
          toast.error("Máximo 10 opciones por pregunta")
          return q
        }
        return { ...q, options: [...q.options, { id: generateId(), text: "" }] }
      })
    )
  }

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        if (q.options.length <= 2) {
          toast.error("Mínimo 2 opciones por pregunta")
          return q
        }
        return { ...q, options: q.options.filter((o) => o.id !== optionId) }
      })
    )
  }

  const updateOption = (questionId: string, optionId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        return {
          ...q,
          options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
        }
      })
    )
  }

  const isValid =
    title.trim().length > 0 &&
    questions.every(
      (q) =>
        q.text.trim().length > 0 &&
        q.options.length >= 2 &&
        q.options.every((o) => o.text.trim().length > 0)
    )

  const handleSave = () => {
    if (!isValid) {
      toast.error("Completa todos los campos requeridos")
      return
    }
    const survey: Survey = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      questions,
      responses: {},
      questionResults: {},
      createdBy: user?.id || "anonymous",
      createdByName: user?.name || "Anónimo",
      createdAt: new Date().toISOString(),
      isActive: true,
      totalResponses: 0,
    }
    onSave(survey)
    onClose()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plus className="h-5 w-5" /> Crear Encuesta
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Title & Description */}
      <div className="space-y-3">
        <Input
          placeholder="Título de la encuesta *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold"
        />
        <Textarea
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <Separator />

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, qi) => (
          <Card key={question.id} className="border-dashed">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Pregunta {qi + 1}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Escribe tu pregunta *"
                value={question.text}
                onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <Select
                  value={question.type}
                  onValueChange={(v) => updateQuestion(question.id, "type", v)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Selección única</SelectItem>
                    <SelectItem value="multiple">Selección múltiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {question.options.map((opt, oi) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6 text-center shrink-0">
                      {oi + 1}.
                    </span>
                    <Input
                      placeholder={`Opción ${oi + 1} *`}
                      value={opt.text}
                      onChange={(e) => updateOption(question.id, opt.id, e.target.value)}
                      className="text-sm"
                    />
                    {question.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeOption(question.id, opt.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => addOption(question.id)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar Opción
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" /> Agregar Pregunta
        </Button>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!isValid}>
          <BarChart3 className="h-4 w-4 mr-2" /> Publicar Encuesta
        </Button>
      </div>
    </div>
  )
}

// ─── Survey Card ────────────────────────────────────────────────────────────────

function SurveyCard({
  survey,
  currentUserId,
  onVote,
  onDelete,
  onToggleActive,
}: {
  survey: Survey
  currentUserId: string | null
  onVote: (surveyId: string, responses: SurveyResponse[]) => void
  onDelete: (surveyId: string) => void
  onToggleActive: (surveyId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showVoter, setShowVoter] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const hasVoted = currentUserId ? !!survey.responses[currentUserId] : false
  const isOwner = survey.createdBy === currentUserId

  const timeAgo = getTimeAgo(survey.createdAt)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{survey.title}</CardTitle>
            {survey.description && (
              <CardDescription className="text-sm line-clamp-2">
                {survey.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {survey.isActive ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                Activa
              </Badge>
            ) : (
              <Badge variant="secondary">Cerrada</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {survey.totalResponses} participante{survey.totalResponses !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {timeAgo}
          </span>
          <span>Por {survey.createdByName}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{survey.questions.length} pregunta{survey.questions.length !== 1 ? "s" : ""}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" /> Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1" /> Ver detalles
              </>
            )}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3">
            {/* Questions preview */}
            {survey.questions.map((q, i) => (
              <div key={q.id} className="text-sm space-y-1">
                <p className="font-medium">
                  {i + 1}. {q.text}
                  {q.type === "multiple" && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      Múltiple
                    </Badge>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5 ml-4">
                  {q.options.map((o) => (
                    <Badge key={o.id} variant="outline" className="text-xs font-normal">
                      {o.text}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}

            {/* Action buttons */}
            <Separator />
            <div className="flex flex-wrap gap-2">
              {survey.isActive && !hasVoted && (
                <Button size="sm" onClick={() => setShowVoter(true)}>
                  <Vote className="h-4 w-4 mr-1.5" /> Votar
                </Button>
              )}
              {hasVoted && !showResults && (
                <Button size="sm" variant="outline" onClick={() => setShowResults(true)}>
                  <BarChart3 className="h-4 w-4 mr-1.5" /> Ver Resultados
                </Button>
              )}
              {isOwner && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleActive(survey.id)}
                  >
                    {survey.isActive ? "Cerrar Encuesta" : "Reabrir Encuesta"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(survey.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                </>
              )}
            </div>

            {/* Voter */}
            {showVoter && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Responder Encuesta</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowVoter(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SurveyVoter
                  survey={survey}
                  onSubmit={(responses) => {
                    onVote(survey.id, responses)
                    setShowVoter(false)
                    setShowResults(true)
                  }}
                />
              </div>
            )}

            {/* Results */}
            {showResults && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Resultados
                  </h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowResults(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SurveyResults survey={survey} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Utility ────────────────────────────────────────────────────────────────────

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-NI")
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function SurveysView() {
  const { user, isAuthenticated } = useAuthStore()
  const { navigate } = useAppStore()
  const [surveys, setSurveys] = useState<Survey[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(SURVEYS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "closed" | "mine">("all")

  const persistSurveys = useCallback((updated: Survey[]) => {
    setSurveys(updated)
    saveSurveys(updated)
  }, [])

  const handleCreate = useCallback(
    (survey: Survey) => {
      const updated = [survey, ...surveys]
      persistSurveys(updated)
      toast.success("Encuesta publicada exitosamente")
    },
    [surveys, persistSurveys]
  )

  const handleVote = useCallback(
    (surveyId: string, responses: SurveyResponse[]) => {
      const userId = user?.id || "anonymous_" + generateId()
      const updated = surveys.map((s) => {
        if (s.id !== surveyId) return s
        const newResponses = { ...s.responses, [userId]: responses.flatMap((r) => r.selectedOptions) }
        const newQuestionResults = { ...s.questionResults }
        // Recalculate results
        for (const q of s.questions) {
          newQuestionResults[q.id] = {}
          for (const opt of q.options) {
            newQuestionResults[q.id][opt.id] = 0
          }
        }
        for (const [, optionIds] of Object.entries(newResponses)) {
          for (const optId of optionIds as string[]) {
            for (const q of s.questions) {
              if (newQuestionResults[q.id] && newQuestionResults[q.id][optId] !== undefined) {
                newQuestionResults[q.id][optId]++
              }
            }
          }
        }
        return {
          ...s,
          responses: newResponses,
          questionResults: newQuestionResults,
          totalResponses: Object.keys(newResponses).length,
        }
      })
      persistSurveys(updated)
      toast.success("Voto registrado exitosamente")
    },
    [user, surveys, persistSurveys]
  )

  const handleDelete = useCallback(
    (surveyId: string) => {
      const updated = surveys.filter((s) => s.id !== surveyId)
      persistSurveys(updated)
      toast.success("Encuesta eliminada")
    },
    [surveys, persistSurveys]
  )

  const handleToggleActive = useCallback(
    (surveyId: string) => {
      const updated = surveys.map((s) =>
        s.id === surveyId ? { ...s, isActive: !s.isActive } : s
      )
      persistSurveys(updated)
      toast.success("Estado de la encuesta actualizado")
    },
    [surveys, persistSurveys]
  )

  // Filtered surveys
  const filtered = surveys.filter((s) => {
    switch (filter) {
      case "active":
        return s.isActive
      case "closed":
        return !s.isActive
      case "mine":
        return s.createdBy === (user?.id || "")
      default:
        return true
    }
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Encuestas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea y participa en encuestas de la comunidad
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Crear Encuesta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: "Todas", count: surveys.length },
            { key: "active", label: "Activas", count: surveys.filter((s) => s.isActive).length },
            { key: "closed", label: "Cerradas", count: surveys.filter((s) => !s.isActive).length },
            ...(isAuthenticated
              ? [{ key: "mine" as const, label: "Mis Encuestas", count: surveys.filter((s) => s.createdBy === user?.id).length }]
              : []),
          ] as const
        ).map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1 text-[10px]">
              {count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Create Survey Dialog */}
      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <CreateSurveyForm
              onClose={() => setShowCreate(false)}
              onSave={handleCreate}
            />
          </CardContent>
        </Card>
      )}

      {/* Survey List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">No hay encuestas</h3>
            <p className="text-muted-foreground text-sm">
              {filter === "all"
                ? "Sé el primero en crear una encuesta para la comunidad"
                : filter === "mine"
                ? "Aún no has creado ninguna encuesta"
                : `No hay encuestas ${filter === "active" ? "activas" : "cerradas"}`}
            </p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear Encuesta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              currentUserId={user?.id || null}
              onVote={handleVote}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

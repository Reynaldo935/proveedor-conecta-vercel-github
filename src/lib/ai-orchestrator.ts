/**
 * Multi-Provider AI Orchestrator
 *
 * Provides a unified interface to multiple AI providers with automatic fallback.
 * Provider priority: Z.ai (free, built-in) → OpenAI → Gemini → DeepSeek → Grok → Blackbox → NotebookLM
 *
 * Each provider:
 * - Checks if its API key env var exists
 * - Uses a 10-second timeout
 * - Falls back to the next provider on failure
 * - Returns the response with provider name
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIResponse {
  content: string
  model: string
  provider: string
  tokensUsed?: number
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface GetAIResponseParams {
  messages: ChatMessage[]
  preferredProvider?: 'zai' | 'openai' | 'gemini' | 'deepseek' | 'grok' | 'blackbox' | 'notebooklm'
  maxTokens?: number
  temperature?: number
}

// ─── Timeout helper ──────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Provider timed out after ${ms}ms`)), ms)
    ),
  ])
}

// ─── Z.ai Provider (free, built-in via z-ai-web-dev-sdk) ─────────────────────

export async function callZAI(
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const typedMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    const completion = await withTimeout(
      zai.chat.completions.create({
        messages: typedMessages,
        thinking: { type: 'disabled' },
      }),
      10_000
    )

    const content = completion?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from Z.ai')
    }

    return {
      content,
      model: 'Z.ai',
      provider: 'zai',
      tokensUsed: completion?.usage?.total_tokens,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[AI Orchestrator] Z.ai failed:', msg)
    throw error
  }
}

// ─── OpenAI Provider ─────────────────────────────────────────────────────────

export async function callOpenAI(
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await withTimeout(
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
        temperature: 0.7,
      }),
    }),
    10_000
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`OpenAI API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  return {
    content,
    model: data.model || 'gpt-4o-mini',
    provider: 'openai',
    tokensUsed: data.usage?.total_tokens,
  }
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

export async function callGemini(
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Extract system instruction from system messages
  const systemInstruction = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n')

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  }

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    }
  }

  const response = await withTimeout(
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    ),
    10_000
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) {
    throw new Error('Empty response from Gemini')
  }

  return {
    content,
    model: 'gemini-2.0-flash',
    provider: 'gemini',
    tokensUsed: data.usageMetadata?.totalTokenCount,
  }
}

// ─── DeepSeek Provider ───────────────────────────────────────────────────────

export async function callDeepSeek(
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  const response = await withTimeout(
    fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
        temperature: 0.7,
      }),
    }),
    10_000
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`DeepSeek API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from DeepSeek')
  }

  return {
    content,
    model: data.model || 'deepseek-chat',
    provider: 'deepseek',
    tokensUsed: data.usage?.total_tokens,
  }
}

// ─── Grok (xAI) Provider ────────────────────────────────────────────────────

export async function callGrok(
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) {
    throw new Error('GROK_API_KEY not configured')
  }

  const response = await withTimeout(
    fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
        temperature: 0.7,
      }),
    }),
    10_000
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Grok API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from Grok')
  }

  return {
    content,
    model: data.model || 'grok-3-mini-fast',
    provider: 'grok',
    tokensUsed: data.usage?.total_tokens,
  }
}

// ─── Blackbox AI Provider ────────────────────────────────────────────────────

export async function callBlackbox(
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  const apiKey = process.env.BLACKBOX_API_KEY
  if (!apiKey) {
    throw new Error('BLACKBOX_API_KEY not configured')
  }

  const response = await withTimeout(
    fetch('https://www.blackbox.ai/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'blackboxai',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
        temperature: 0.7,
      }),
    }),
    10_000
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Blackbox AI API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from Blackbox AI')
  }

  return {
    content,
    model: data.model || 'blackboxai',
    provider: 'blackbox',
    tokensUsed: data.usage?.total_tokens,
  }
}

// ─── NotebookLM Provider (Gemini-based with document analysis system prompt) ──

const NOTEBOOKLM_SYSTEM_PROMPT = `You are NotebookLM, an advanced AI research assistant specialized in document analysis and knowledge synthesis. You help users understand, summarize, and extract insights from documents and complex information.

Your capabilities include:
- Deep document analysis and comprehension
- Summarizing long texts into concise key points
- Extracting specific information and data from documents
- Comparing and contrasting information across sources
- Generating study guides and briefing documents
- Answering questions with citations from the source material
- Identifying themes, patterns, and connections in complex texts

When responding:
- Always ground your answers in the provided context or documents
- Cite specific sections when referencing information
- Provide structured, organized responses with clear headings
- Use bullet points and numbered lists for clarity
- Acknowledge uncertainty when information is ambiguous or not in the source
- Offer to dive deeper into any topic of interest`

export async function callNotebookLM(
  messages: Array<{ role: string; content: string }>
): Promise<AIResponse> {
  const apiKey = process.env.NOTEBOOKLM_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('NOTEBOOKLM_API_KEY (or GEMINI_API_KEY) not configured')
  }

  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Use NotebookLM-specific system prompt, combining with any user-provided system messages
  const userSystemInstruction = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n')

  const fullSystemInstruction = userSystemInstruction
    ? `${NOTEBOOKLM_SYSTEM_PROMPT}\n\nAdditional context:\n${userSystemInstruction}`
    : NOTEBOOKLM_SYSTEM_PROMPT

  const body: Record<string, unknown> = {
    contents,
    systemInstruction: {
      parts: [{ text: fullSystemInstruction }],
    },
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  }

  const response = await withTimeout(
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    ),
    10_000
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`NotebookLM API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) {
    throw new Error('Empty response from NotebookLM')
  }

  return {
    content,
    model: 'notebooklm-gemini-2.0-flash',
    provider: 'notebooklm',
    tokensUsed: data.usageMetadata?.totalTokenCount,
  }
}

// ─── Provider Registry ───────────────────────────────────────────────────────

type ProviderName = 'zai' | 'openai' | 'gemini' | 'deepseek' | 'grok' | 'blackbox' | 'notebooklm'

const PROVIDERS: Record<ProviderName, (messages: Array<{ role: string; content: string }>) => Promise<AIResponse>> = {
  zai: callZAI,
  openai: callOpenAI,
  gemini: callGemini,
  deepseek: callDeepSeek,
  grok: callGrok,
  blackbox: callBlackbox,
  notebooklm: callNotebookLM,
}

const PROVIDER_PRIORITY: ProviderName[] = ['zai', 'openai', 'gemini', 'deepseek', 'grok', 'blackbox', 'notebooklm']

// ─── Main Orchestrator Function ──────────────────────────────────────────────

/**
 * Try AI providers in order until one succeeds.
 * If preferredProvider is specified, starts with that provider then follows priority order.
 */
export async function getAIResponse(params: GetAIResponseParams): Promise<AIResponse> {
  const {
    messages,
    preferredProvider,
    maxTokens,
    temperature,
  } = params

  // Build the ordered provider list
  let orderedProviders: ProviderName[]

  if (preferredProvider && preferredProvider in PROVIDERS) {
    // Start with preferred, then add the rest in priority order
    const remaining = PROVIDER_PRIORITY.filter((p) => p !== preferredProvider)
    orderedProviders = [preferredProvider, ...remaining]
  } else {
    orderedProviders = [...PROVIDER_PRIORITY]
  }

  // Try each provider in order
  const errors: string[] = []

  for (const providerName of orderedProviders) {
    try {
      // Add maxTokens/temperature hints as system message context if provided
      const enhancedMessages = [...messages]
      if (maxTokens || temperature) {
        // These params are handled by the provider calls internally
        // For now, they're informational for future enhancement
        void enhancedMessages
      }

      const result = await PROVIDERS[providerName](enhancedMessages)
      return result
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      errors.push(`${providerName}: ${msg}`)
      console.warn(`[AI Orchestrator] ${providerName} failed, trying next: ${msg}`)
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed: ${errors.join('; ')}`)
}

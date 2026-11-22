# AI Provider Configuration Guide (Phase 9)
**GTA 6 Player Hub – Configuration & Deployment Reference**
**Date**: November 22, 2026

---

## 1. Environment Variables

The AI Gaming Problem Solver backend is configured via standard environment variables in `.env` (or Docker/production orchestrator environment):

| Variable | Type | Default | Description |
|---|---|---|---|
| `AI_PROVIDER` | string | `mock` | Active provider: `mock`, `openai`, `gemini` |
| `AI_API_KEY` | string | `""` | Secret API key for OpenAI or Google Gemini |
| `AI_MODEL` | string | `""` | Model identifier (e.g. `gemini-1.5-flash`, `gpt-4o`) |
| `AI_API_BASE_URL` | string | `""` | Optional custom base URL (e.g. for Azure OpenAI or proxy) |
| `AI_MAX_TOKENS` | integer | `2048` | Maximum output tokens per diagnostic completion |
| `AI_TEMPERATURE` | float | `0.3` | Completion temperature (low values guarantee factual consistency) |

---

## 2. Configuration Recipes

### 2.1 Development & Offline Testing (Mock Engine - Default)
No API keys required. All features, categories, and safety protocols function deterministically.
```bash
AI_PROVIDER=mock
AI_MODEL=gta6-diagnostic-v1-mock
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.3
```

### 2.2 Production with Google Gemini
```bash
AI_PROVIDER=gemini
AI_API_KEY=AIzaSy...your_gemini_api_key_here...
AI_MODEL=gemini-1.5-flash
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.2
```

### 2.3 Production with OpenAI
```bash
AI_PROVIDER=openai
AI_API_KEY=sk-proj-...your_openai_api_key_here...
AI_MODEL=gpt-4o
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.2
```

---

## 3. Security & Key Protection Mandates

1. **Backend-Only Access**: AI API keys are **never** exposed to the Next.js frontend or client bundle. All inference calls originate strictly from the FastAPI application layer.
2. **Graceful Fallback**: If an invalid API key, network timeout, or quota exhaustion occurs on a live provider, the system falls back gracefully to `MockAIProvider` without dropping active player sessions or crashing the server.
3. **Safe Redaction**: API keys and authorization headers are scrubbed from server logs and diagnostics output.

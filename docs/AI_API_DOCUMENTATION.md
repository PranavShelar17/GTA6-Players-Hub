# AI Problem Solver API Documentation (Phase 9)
**GTA 6 Player Hub – REST API Reference**
**Base URL**: `/api/v1/ai`
**Date**: November 22, 2026

---

## 1. Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/status` | Public | Returns AI service status, model, vision support, and indexed documents count |
| `GET` | `/categories` | Public | Returns 8 suggested problem categories and starter queries |
| `POST` | `/conversations` | Optional | Creates a new troubleshooting conversation session |
| `GET` | `/conversations` | Authenticated | Lists conversation history for the current player |
| `GET` | `/conversations/{id}` | Optional | Retrieves conversation detail and full message thread |
| `PATCH` | `/conversations/{id}` | Optional | Updates conversation title or category |
| `DELETE` | `/conversations/{id}` | Optional | Deletes a conversation session |
| `POST` | `/conversations/{id}/messages` | Optional | Sends a message to the AI diagnostic assistant and returns the 5-part response |
| `POST` | `/attachments` | Public | Uploads an error screenshot or crash image (max 10MB) |
| `POST` | `/feedback` | Optional | Submits player feedback or reports an inaccurate response |

---

## 2. Request & Response Examples

### 2.1 Get AI Service Status
`GET /api/v1/ai/status`
```json
{
  "status": "ONLINE",
  "provider": "Mock Diagnostic Engine",
  "model": "gta6-diagnostic-v1-mock",
  "supports_vision": true,
  "max_context_tokens": 4096,
  "knowledge_documents_indexed": 5,
  "knowledge_sources_indexed": 5,
  "notice": "Operating in provider-independent simulated diagnostic mode."
}
```

### 2.2 Create Conversation
`POST /api/v1/ai/conversations`
```json
{
  "title": "Crash on Startup ERR_GFX_D3D_INIT",
  "category": "game_crashes",
  "initial_query": "How do I fix ERR_GFX_D3D_INIT?",
  "include_hardware_context": true
}
```

### 2.3 Send Message
`POST /api/v1/ai/conversations/{id}/messages`
```json
{
  "content": "How do I cleanly reinstall my NVIDIA GPU drivers?",
  "attachment_url": null,
  "include_hardware_context": true
}
```

**Response (5-Part Standard):**
```json
{
  "id": "118bb9d6-e265-4d3b-9a25-c60f4e19f79b",
  "conversation_id": "4a761e6c-7e61-4bb2-b5e1-518296a8e805",
  "role": "assistant",
  "content": "### 1. Problem Understanding\nYou are requesting instructions for a clean graphics driver reinstallation to resolve graphical corruption, driver timeouts, or game crashes.\n\n### 2. Possible Causes\n1. Residual registry entries or corrupted DLL files from previous driver versions.\n2. Incomplete driver updates via Windows Update conflicting with official drivers.\n3. Third-party overlay hooks (GeForce Experience, Discord, RivaTuner) hooking the driver pipeline.\n\n### 3. Recommended Steps\n1. Download the latest WHQL driver package from NVIDIA's official website.\n2. Download Display Driver Uninstaller (DDU) from Wagnardsoft.\n3. Disconnect your PC from the internet to prevent Windows Update from automatically downloading generic drivers.\n4. Reboot into Windows Safe Mode.\n5. Launch DDU, select 'GPU', choose 'NVIDIA', and click 'Clean and restart'.\n6. After rebooting back to normal Windows, run the official installer and select 'Custom (Advanced)' -> check 'Perform a clean installation'.\n\n### 4. Expected Result\nYour display adapter will be running clean, uncorrupted official driver files without lingering registry fragments.\n\n### 5. Next Step\nIf crashes persist after a clean reinstall, monitor GPU temperatures using HWInfo64 to verify whether thermal throttling is triggering hardware resets.",
  "hardware_context_attached": true,
  "hardware_summary": "Intel Core i7-13700K / NVIDIA GeForce RTX 4070 (12GB) / 32GB RAM",
  "tokens_used": 348,
  "model_name": "gta6-diagnostic-v1-mock",
  "created_at": "2026-11-22T20:50:00Z"
}
```

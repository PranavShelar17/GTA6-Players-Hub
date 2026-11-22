/**
 * GTA 6 Player Hub - AI Gaming Problem Solver API Client (Phase 9)
 * Interfaces with FastAPI Backend at /api/v1/ai/*
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// -----------------------------------------------------------------------------
// Interfaces & Types
// -----------------------------------------------------------------------------

export interface AIServiceStatus {
  status: "ONLINE" | "MOCK_MODE" | "MAINTENANCE" | "OFFLINE";
  provider: string;
  model: string;
  supports_vision: boolean;
  max_context_tokens: number;
  knowledge_documents_indexed: number;
  knowledge_sources_indexed: number;
  notice?: string | null;
}

export interface SuggestedProblemCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  sample_queries: string[];
}

export interface AIMessageItem {
  id: string;
  conversation_id: string;
  role: "player" | "assistant" | "system";
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  hardware_context_attached: boolean;
  hardware_summary?: string | null;
  tokens_used?: number | null;
  model_name?: string | null;
  feedback_rating?: "helpful" | "not_helpful" | null;
  created_at: string;
}

export interface AIConversationItem {
  id: string;
  user_id?: string | null;
  title: string;
  category?: string | null;
  message_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface AIConversationDetail extends AIConversationItem {
  messages: AIMessageItem[];
}

export interface AIConversationListResponse {
  total: number;
  limit: number;
  offset: number;
  items: AIConversationItem[];
}

export interface CreateConversationPayload {
  title?: string;
  category?: string;
  initial_query?: string;
  include_hardware_context?: boolean;
}

export interface SendMessagePayload {
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  include_hardware_context?: boolean;
}

export interface SubmitFeedbackPayload {
  message_id: string;
  conversation_id: string;
  rating: "helpful" | "not_helpful" | "reported";
  feedback_tag?: string;
  report_reason?: string;
  comments?: string;
}

export interface ScreenshotUploadResponse {
  attachment_url: string;
  file_name: string;
  size_bytes: number;
  content_type: string;
  uploaded_at: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// -----------------------------------------------------------------------------
// API Client Functions
// -----------------------------------------------------------------------------

/**
 * Fetch the AI Service operational status & active provider info.
 */
export async function fetchAIServiceStatus(): Promise<AIServiceStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/status`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch AI status: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn("Using offline AI status fallback:", error);
    return {
      status: "MOCK_MODE",
      provider: "Mock Diagnostic Engine",
      model: "gta6-diagnostic-v1-mock",
      supports_vision: true,
      max_context_tokens: 4096,
      knowledge_documents_indexed: 5,
      knowledge_sources_indexed: 5,
      notice: "Operating in provider-independent simulated diagnostic mode.",
    };
  }
}

/**
 * Fetch the 8 suggested problem categories and quick query prompts.
 */
export async function fetchSuggestedCategories(): Promise<SuggestedProblemCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/categories`, {
      method: "GET",
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch suggested categories: ${res.statusText}`);
    }
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.warn("Using local category fallback:", error);
    return [
      {
        id: "game_installation",
        name: "Game Installation",
        description: "Launcher verification, disk allocation, installer error codes and corrupt downloads.",
        icon_name: "Download",
        sample_queries: [
          "Game installation freezes at 99% disk write",
          "Resolving Rockstar Launcher Error Code 1000",
          "How to safely verify game cache without redownloading"
        ],
      },
      {
        id: "game_crashes",
        name: "Game Crashes & Errors",
        description: "Crash to desktop (CTD), silent closes, D3D device lost, and memory dump analysis.",
        icon_name: "Flame",
        sample_queries: [
          "Game closes to desktop without any error message after 15 minutes",
          "How to fix ERR_GFX_D3D_INIT crash",
          "Resolving unhandled exception 0xc0000005 crash"
        ],
      },
      {
        id: "graphics_display",
        name: "Graphics & Display",
        description: "Shader compilation stutters, black screen on launch, HDR bugs, and multi-monitor setup.",
        icon_name: "Monitor",
        sample_queries: [
          "Black screen with audio playing on startup",
          "Fixing severe screen tearing with G-Sync enabled",
          "DirectX 12 vs Vulkan pipeline comparison"
        ],
      },
      {
        id: "performance_fps",
        name: "Performance & FPS",
        description: "Frame drops, micro-stutters, CPU/GPU thermal throttling, and paging file optimization.",
        icon_name: "Zap",
        sample_queries: [
          "Sudden FPS drops from 60 to 20 when entering dense city areas",
          "Optimizing Windows virtual memory paging file",
          "How to fix 100% CPU usage micro-stuttering"
        ],
      },
      {
        id: "pc_hardware",
        name: "PC Hardware",
        description: "VRAM overflow, GPU bottlenecking, thermal limits, and clean driver reinstallation.",
        icon_name: "Cpu",
        sample_queries: [
          "Step-by-step clean GPU driver reinstall using DDU",
          "Will 8GB VRAM cause texture popping at 1440p?",
          "Diagnosing GPU thermal throttling past 85C"
        ],
      },
      {
        id: "network_connectivity",
        name: "Network & Connectivity",
        description: "High ping, packet loss, NAT type strict, multiplayer desync, and firewall port forwarding.",
        icon_name: "Wifi",
        sample_queries: [
          "How to change Strict NAT to Open NAT for multiplayer",
          "Fixing random session disconnection error 0x20010006",
          "Flushing DNS and resetting Windows TCP/IP stack"
        ],
      },
      {
        id: "controller_input",
        name: "Controller & Input",
        description: "DualSense adaptive triggers, Xbox controller drift, keybinding overrides, and Steam input conflicts.",
        icon_name: "Gamepad2",
        sample_queries: [
          "PS5 DualSense controller not recognized over Bluetooth",
          "Fixing double-input bug when running through Steam",
          "Calibrating controller analog stick deadzone"
        ],
      },
      {
        id: "general_support",
        name: "General Gaming Support",
        description: "Windows Game Mode, background app interference, antivirus false positives, and audio output.",
        icon_name: "HelpCircle",
        sample_queries: [
          "Windows Defender flagging game binary as false positive",
          "Game audio missing or playing through wrong device",
          "Disabling Discord and GeForce Experience overlays"
        ],
      },
    ];
  }
}

/**
 * Start a new AI troubleshooting conversation.
 */
export async function createConversation(
  payload: CreateConversationPayload,
  token?: string | null
): Promise<AIConversationDetail> {
  const res = await fetch(`${API_BASE_URL}/ai/conversations`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create conversation: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Fetch a player's previous conversations (authenticated).
 */
export async function fetchConversations(
  limit = 20,
  offset = 0,
  token?: string | null
): Promise<AIConversationListResponse> {
  const res = await fetch(
    `${API_BASE_URL}/ai/conversations?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch conversations: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Fetch a single conversation with all its messages.
 */
export async function fetchConversation(
  conversationId: string,
  token?: string | null
): Promise<AIConversationDetail> {
  const res = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch conversation: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Update conversation title or metadata.
 */
export async function updateConversation(
  conversationId: string,
  payload: { title?: string },
  token?: string | null
): Promise<AIConversationItem> {
  const res = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update conversation: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Delete a conversation.
 */
export async function deleteConversation(
  conversationId: string,
  token?: string | null
): Promise<{ status: string; deleted_id: string }> {
  const res = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete conversation: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Send a message to the AI diagnostic assistant.
 */
export async function sendMessage(
  conversationId: string,
  payload: SendMessagePayload,
  token?: string | null
): Promise<AIMessageItem> {
  const res = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send message: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Upload an error screenshot / photo (PNG, JPG, JPEG, WebP up to 10MB).
 */
export async function uploadScreenshotAttachment(
  file: File
): Promise<ScreenshotUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/ai/attachments`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload screenshot: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Submit player feedback (Helpful, Not Helpful, or Report).
 */
export async function submitResponseFeedback(
  payload: SubmitFeedbackPayload,
  token?: string | null
): Promise<{ id: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/ai/feedback`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to submit feedback: ${errorText || res.statusText}`);
  }

  return await res.json();
}

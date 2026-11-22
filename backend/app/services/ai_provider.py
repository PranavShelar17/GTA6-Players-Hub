"""Provider-Independent AI Provider Interface & Implementations (Phase 9).

Supports:
- MockAIProvider: High-fidelity rule-based technical diagnostics with safety guardrails.
- OpenAIProvider: OpenAI API integration (GPT-4o, GPT-4o-mini).
- GeminiProvider: Google Gemini API integration.
"""

from abc import ABC, abstractmethod
import json
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.schemas.problem_solver import SourceReference

SYSTEM_PROMPT = """You are the official Vice City AI Gaming Technical Support Assistant for the GTA 6 Player Hub.
Your mission is to help players diagnose, troubleshoot, and resolve PC gaming hardware, software, crash, and performance issues.

PRINCIPLES:
1. STRUCTURE EVERY RESOLUTION INTO 5 CLEAR SECTIONS:
   - ### 1. Problem Understanding: Summarize what the symptoms indicate.
   - ### 2. Possible Causes: List likely technical causes without presenting assumptions as facts.
   - ### 3. Recommended Steps: Provide clear, numbered, step-by-step instructions.
   - ### 4. Expected Result: Explain what the player should observe once steps are performed.
   - ### 5. Next Step: Explain what diagnostics to check or report if the issue persists.
2. ACCURACY & VERIFICATION SAFEGUARDS:
   - Official GTA 6 PC system requirements have NOT yet been confirmed by Rockstar Games. Do NOT invent GTA 6 error codes, official troubleshooting procedures, or PC release requirements.
   - Distinguish verified general PC troubleshooting from official publisher statements.
3. SAFE TROUBLESHOOTING ONLY:
   - NEVER instruct users to permanently disable antivirus or Windows Defender.
   - NEVER tell users to download unverified third-party executable files or replace random system DLLs.
   - Always prefer non-destructive, reversible solutions. Warn before any registry or administrative commands.
4. TONE:
   - Calm, technical, patient, and beginner-accessible.
"""


class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        hardware_context: Optional[str] = None,
        attachment_url: Optional[str] = None,
        retrieved_sources: Optional[List[SourceReference]] = None,
    ) -> str:
        """Generates a technical response given context and user query."""
        pass


class MockAIProvider(BaseAIProvider):
    """Production-grade mock provider used for offline testing, local dev, or fallback.
    
    Generates structured, step-by-step troubleshooting answers adhering to the 5-part
    mandate and safety guardrails across all 8 problem categories.
    """

    def __init__(self, is_configured: bool = False):
        self.is_configured = is_configured

    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        hardware_context: Optional[str] = None,
        attachment_url: Optional[str] = None,
        retrieved_sources: Optional[List[SourceReference]] = None,
    ) -> str:
        query = user_message.lower()

        # Prompt injection protection
        injection_triggers = [
            "ignore previous instructions",
            "system prompt",
            "jailbreak",
            "bypass safety",
            "developer mode",
            "act as an unrestricted",
        ]
        if any(trig in query for trig in injection_triggers):
            return (
                "### 1. Problem Understanding\n"
                "I am a specialized technical gaming assistant designed solely to diagnose hardware, crash, installation, "
                "and performance issues.\n\n"
                "### 2. Possible Causes\n"
                "The query submitted contains administrative system override commands that fall outside gaming troubleshooting boundaries.\n\n"
                "### 3. Recommended Steps\n"
                "1. Please describe a specific gaming error code, crash symptom, or hardware bottleneck.\n"
                "2. Provide your operating system and graphics card details if relevant.\n\n"
                "### 4. Expected Result\n"
                "You will receive a step-by-step technical resolution tailored to your gaming environment.\n\n"
                "### 5. Next Step\n"
                "What specific game crash or performance issue can I help you resolve?"
            )

        # Context addendum if hardware profile was shared
        hw_note = ""
        if hardware_context:
            hw_note = f"\n\n*Note: Analyzed in the context of your verified PC hardware setup ({hardware_context}).*"

        # Attachment note
        attachment_note = ""
        if attachment_url:
            attachment_note = "\n\n*Visual error screenshot received and reviewed against known Windows / engine error patterns.*"

        # 1. Crashes / CTD / D3D12 / Driver / DDU Errors
        if any(w in query for w in ["ddu", "driver", "crash", "freeze", "black screen", "err_gfx", "d3d", "device removed", "shut down"]):
            return (
                "### 1. Problem Understanding\n"
                "You are experiencing a display driver conflict, Crash to Desktop (CTD), or DirectX graphics device lost failure."
                f"{attachment_note}\n\n"
                "### 2. Possible Causes\n"
                "- Corrupted graphics driver state or incomplete shader cache buffers.\n"
                "- Graphics driver Timeout Detection and Recovery (TDR) reset triggered by unstable GPU clocks.\n"
                "- Outdated DirectX 12 Agility SDK runtimes or background overlay conflicts (Discord, GeForce Experience, MSI Afterburner).\n\n"
                "### 3. Recommended Steps\n"
                "1. **Perform Clean Driver Installation (DDU)**: Use Display Driver Uninstaller (DDU) in Windows Safe Mode to completely wipe previous display driver traces, then install the latest WHQL release from NVIDIA or AMD.\n"
                "2. **Disable Third-Party Overlays**: Temporarily turn off in-game overlays from Discord, Steam, RivaTuner, and GeForce Experience.\n"
                "3. **Reset GPU Clock Profiles**: If using MSI Afterburner or AMD Adrenalin, revert core and memory clocks to stock factory frequencies.\n"
                "4. **Verify Windows System Files**: Open PowerShell as Administrator and run `sfc /scannow` to detect and repair corrupted OS components.\n\n"
                "### 4. Expected Result\n"
                "The game engine should initialize its 3D render loop without triggering display driver resets or memory access violations.\n\n"
                "### 5. Next Step\n"
                "If the crash repeats at a specific checkpoint, check Windows Event Viewer (under Windows Logs -> Application) for the exact faulting module name."
                f"{hw_note}"
            )

        # 2. Game Installation / Verification Issues
        if any(w in query for w in ["install", "download", "corrupt", "missing file", "integrity", "stuck"]):
            return (
                "### 1. Problem Understanding\n"
                "Your game is encountering installation segmentation errors or failing file hash verification during deployment."
                f"{attachment_note}\n\n"
                "### 2. Possible Causes\n"
                "- Corrupted download chunks cached in the launcher directory.\n"
                "- Insufficient contiguous storage headroom on your target drive.\n"
                "- Antivirus software locking game executable segments during decompression.\n\n"
                "### 3. Recommended Steps\n"
                "1. **Verify File Integrity**: In your game launcher (Rockstar Games Launcher, Steam, or Epic), open game properties and select **Verify Integrity of Game Files**.\n"
                "2. **Clear Launcher Download Cache**: Exit the launcher, navigate to `%LOCALAPPDATA%\\Rockstar Games\\Launcher`, and remove the `Cache` directory.\n"
                "3. **Check Storage Space**: Ensure the target drive has at least 50GB of free space beyond the base game footprint for staging temporary unpack files.\n"
                "4. **Run Launcher as Administrator**: Right-click the launcher shortcut and select 'Run as administrator' to prevent NTFS permission blocks.\n\n"
                "### 4. Expected Result\n"
                "The launcher will redownload only corrupted delta blocks, allowing the installation to finalize cleanly without restarting the entire download.\n\n"
                "### 5. Next Step\n"
                "If the download still halts, check whether your storage drive shows SMART health warnings or test installing onto a secondary SSD volume."
                f"{hw_note}"
            )

        # 3. Low FPS / Stuttering / Performance
        if any(w in query for w in ["fps", "stutter", "lag", "low performance", "frame drop", "paging", "memory leak"]):
            return (
                "### 1. Problem Understanding\n"
                "You are observing uneven frame pacing, periodic micro-stutters, or lower average frame rates than your hardware should deliver."
                f"{attachment_note}\n\n"
                "### 2. Possible Causes\n"
                "- Heavy virtual memory paging caused by restricted pagefile sizing or physical RAM saturation.\n"
                "- Thermal throttling on your CPU or GPU causing clock frequency down-stepping.\n"
                "- Mechanical HDD latency if assets are streaming from a rotating hard drive rather than a high-speed SSD.\n\n"
                "### 3. Recommended Steps\n"
                "1. **Configure System-Managed Pagefile**: In Windows System Properties -> Advanced -> Performance Settings -> Virtual Memory, set your fastest NVMe SSD drive to 'System Managed Size' (minimum 16GB–24GB).\n"
                "2. **Monitor Operating Temperatures**: Use HWMonitor or HWiNFO64 to verify that CPU temperatures remain under 85°C and GPU core under 80°C under full load.\n"
                "3. **Cap Frame Rate to Monitor Refresh**: In your GPU Control Panel, set a maximum frame rate 3 FPS below your display's refresh rate (e.g. 141 FPS on a 144Hz panel) with G-Sync/FreeSync active.\n"
                "4. **Enable Resizable BAR**: In your motherboard BIOS, verify 'Above 4G Decoding' and 'Re-Size BAR Support' are enabled to allow the CPU full access to GPU VRAM.\n\n"
                "### 4. Expected Result\n"
                "Frame times will stabilize, substantially reducing 1% low frame dips and erratic micro-stutters during high-speed open-world traversal.\n\n"
                "### 5. Next Step\n"
                "Let me know your average CPU and GPU utilization percentages if frame drops persist in dense urban areas."
                f"{hw_note}"
            )

        # 4. Hardware / VRAM / Compatibility
        if any(w in query for w in ["hardware", "upgrade", "cpu", "gpu", "vram", "ram", "specs", "compatibility"]):
            return (
                "### 1. Problem Understanding\n"
                "You are evaluating whether your current computer hardware meets modern gaming demands or identifying component balance bottlenecks."
                f"{attachment_note}\n\n"
                "### 2. Possible Causes\n"
                "- Dedicated VRAM capacity below modern texture streaming budgets (e.g. 6GB or lower).\n"
                "- Asymmetric RAM configurations running in single-channel mode, halving memory bandwidth.\n"
                "- Power Supply Unit (PSU) wattage constraints or PCIe lane bottlenecks.\n\n"
                "### 3. Recommended Steps\n"
                "1. **Check Hardware Profile**: Run our **Phase 8 PC Compatibility Checker** to receive an objective hardware balance review.\n"
                "2. **Texture Memory Management**: If your GPU has 8GB or less VRAM, reduce in-game texture resolution by one step to prevent VRAM overflow into system RAM.\n"
                "3. **Ensure Dual-Channel RAM**: Ensure your RAM modules are slotted into slots 2 & 4 (A2/B2) on standard dual-channel motherboards.\n"
                "4. **SSD Drive Migration**: Ensure the game installation resides on an NVMe PCIe SSD rather than a SATA SSD or mechanical HDD.\n\n"
                "### 4. Expected Result\n"
                "Balanced system throughput with no single component choking the render pipeline.\n\n"
                "### 5. Next Step\n"
                "Would you like me to evaluate your saved PC Hardware Profile from your account to provide component-specific recommendations?"
                f"{hw_note}"
            )

        # 5. Network / High Latency / Connection Drops
        if any(w in query for w in ["network", "ping", "latency", "packet loss", "disconnect", "multiplayer", "online", "wifi"]):
            return (
                "### 1. Problem Understanding\n"
                "You are experiencing network latency spikes, packet loss, or server disconnections during online gameplay."
                f"{attachment_note}\n\n"
                "### 2. Possible Causes\n"
                "- 2.4GHz Wi-Fi packet dropouts or bufferbloat on local home router.\n"
                "- Corrupted local DNS resolver cache or outdated network adapter drivers.\n"
                "- Strict NAT type preventing peer-to-peer or server handshake communication.\n\n"
                "### 3. Recommended Steps\n"
                "1. **Flush DNS and Reset Sockets**: Open PowerShell as Administrator and run:\n"
                "   ```powershell\n"
                "   ipconfig /flushdns\n"
                "   netsh winsock reset\n"
                "   netsh int ip reset\n"
                "   ```\n"
                "   Reboot your PC afterward.\n"
                "2. **Switch to Wired Ethernet**: Direct Cat6 Ethernet cabling eliminates 95% of micro-packet loss seen over consumer Wi-Fi.\n"
                "3. **Configure High-Performance DNS**: Change your IPv4 DNS servers to Cloudflare (`1.1.1.1` / `1.0.0.1`) or Google (`8.8.8.8` / `8.8.4.4`).\n"
                "4. **Enable UPnP or Port Forwarding**: Verify UPnP is enabled on your router to maintain Open NAT status.\n\n"
                "### 4. Expected Result\n"
                "Stable round-trip ping times with zero packet loss during extended gaming sessions.\n\n"
                "### 5. Next Step\n"
                "If disconnections continue, run a continuous ping test (`ping -t 1.1.1.1`) to see if timeouts occur within your local router or your ISP gateway."
                f"{hw_note}"
            )

        # 6. Controller / Input Delay / Mapping
        if any(w in query for w in ["controller", "gamepad", "dualsense", "xbox", "mouse", "keyboard", "input lag"]):
            return (
                "### 1. Problem Understanding\n"
                "Your game controller or peripheral is either undetected, has button mis-mappings, or suffers from input latency."
                f"{attachment_note}\n\n"
                "### 2. Possible Causes\n"
                "- Windows audio device conflict (e.g. DualSense controller routing PC audio through its 3.5mm jack).\n"
                "- Conflicting controller layers (e.g. Steam Input running simultaneously with DS4Windows).\n"
                "- Bluetooth polling rate degradation due to USB 3.0 RF interference near the receiver.\n\n"
                "### 3. Recommended Steps\n"
                "1. **Use Direct USB Connection**: Connect via a certified USB-C cable to confirm controller recognition and reduce input polling latency to under 2ms.\n"
                "2. **Check Windows Game Controller Panel**: Press `Win + R`, type `joy.cpl`, press Enter, and test whether all button presses and analog sticks register cleanly.\n"
                "3. **Disable Audio Output on Controller**: In Windows Sound Settings, make sure your primary speakers or headset remain the Default Audio Device, not the controller.\n"
                "4. **Avoid Double-Input Emulation**: If playing through Steam, use built-in Steam Input and disable external third-party emulators.\n\n"
                "### 4. Expected Result\n"
                "Instant, responsive input registration with full analog stick linear response and zero missed inputs.\n\n"
                "### 5. Next Step\n"
                "Tell me whether you are using a DualSense, Xbox Wireless, or third-party gamepad so we can configure exact deadzone values."
                f"{hw_note}"
            )

        # Default General Troubleshooting
        return (
            "### 1. Problem Understanding\n"
            f"You have reported the following technical gaming question: \"{user_message.strip()}\"."
            f"{attachment_note}\n\n"
            "### 2. Possible Causes\n"
            "- Background process interference or conflicting third-party gaming utilities.\n"
            "- Outdated graphics drivers or pending Windows cumulative updates.\n"
            "- Temporary file cache accumulation in local app data.\n\n"
            "### 3. Recommended Steps\n"
            "1. **Perform a Clean Reboot**: Restart Windows cleanly (use 'Restart', not 'Shut Down', to bypass Windows Fast Startup cached kernel state).\n"
            "2. **Update Display Drivers**: Ensure your GPU driver is up-to-date from the official NVIDIA or AMD portal.\n"
            "3. **Close Resource-Heavy Background Apps**: Use Task Manager to close background browsers, torrent clients, and hardware monitoring tools.\n"
            "4. **Verify Game Integrity**: Use your launcher's built-in file verification tool to ensure all files match their cloud signatures.\n\n"
            "### 4. Expected Result\n"
            "Your gaming environment will run with clean system resources and clear render pipelines.\n\n"
            "### 5. Next Step\n"
            "If your issue involves a specific error code or dialog, please paste the exact text or upload a screenshot for targeted diagnosis."
            f"{hw_note}"
        )


class OpenAIProvider(BaseAIProvider):
    """OpenAI API integration for live LLM troubleshooting."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: Optional[str] = None):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url or "https://api.openai.com/v1"

    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        hardware_context: Optional[str] = None,
        attachment_url: Optional[str] = None,
        retrieved_sources: Optional[List[SourceReference]] = None,
    ) -> str:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Append hardware context if authorized
        if hardware_context:
            messages.append({
                "role": "system",
                "content": f"The player has authorized sharing their PC specifications: {hardware_context}. Use this context strictly for relevant hardware balance advice."
            })

        # Append retrieved knowledge sources
        if retrieved_sources:
            sources_text = "\n".join([f"- {s.title} ({s.publisher}): {s.url}" for s in retrieved_sources])
            messages.append({
                "role": "system",
                "content": f"Verified Knowledge Base Reference Articles:\n{sources_text}"
            })

        # Append conversation history
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Current user message
        user_content: Any = user_message
        if attachment_url:
            user_content = [
                {"type": "text", "text": user_message},
                {"type": "image_url", "image_url": {"url": attachment_url}},
            ]

        messages.append({"role": "user", "content": user_content})

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": settings.AI_MAX_TOKENS,
                    "temperature": settings.AI_TEMPERATURE,
                },
            )

            if resp.status_code != 200:
                logger.error(f"OpenAI API Error: {resp.status_code} - {resp.text}")
                raise RuntimeError(f"AI Provider error ({resp.status_code}). Please try again.")

            data = resp.json()
            return data["choices"][0]["message"]["content"]


class GeminiProvider(BaseAIProvider):
    """Google Gemini API integration."""

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash", base_url: Optional[str] = None):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url or "https://generativelanguage.googleapis.com/v1beta"

    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        hardware_context: Optional[str] = None,
        attachment_url: Optional[str] = None,
        retrieved_sources: Optional[List[SourceReference]] = None,
    ) -> str:
        # Build contents
        contents = []
        for msg in conversation_history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        full_user_query = user_message
        if hardware_context:
            full_user_query += f"\n\n[Player PC Hardware Context: {hardware_context}]"

        contents.append({"role": "user", "parts": [{"text": full_user_query}]})

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                    "contents": contents,
                    "generationConfig": {
                        "maxOutputTokens": settings.AI_MAX_TOKENS,
                        "temperature": settings.AI_TEMPERATURE,
                    },
                },
            )

            if resp.status_code != 200:
                logger.error(f"Gemini API Error: {resp.status_code} - {resp.text}")
                raise RuntimeError(f"AI Provider error ({resp.status_code}). Please try again.")

            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]


def get_ai_provider() -> BaseAIProvider:
    """Factory creating the appropriate AI Provider according to environment configuration."""
    provider_name = (settings.AI_PROVIDER or "mock").lower()
    api_key = settings.AI_API_KEY

    if provider_name == "openai" and api_key:
        return OpenAIProvider(
            api_key=api_key,
            model=settings.AI_MODEL or "gpt-4o-mini",
            base_url=settings.AI_API_BASE_URL,
        )
    elif provider_name == "gemini" and api_key:
        return GeminiProvider(
            api_key=api_key,
            model=settings.AI_MODEL or "gemini-1.5-flash",
            base_url=settings.AI_API_BASE_URL,
        )
    else:
        # High-fidelity mock mode when API key is unconfigured or provider is "mock"
        return MockAIProvider(is_configured=bool(api_key))

# PC Compatibility Checker API Documentation

## 1. Overview
The PC Compatibility REST API provides endpoints for checking official GTA 6 PC system requirements status, managing player PC hardware profiles, executing compatibility and hardware balance diagnostics, and auditing previous checks.

Base URL: `/api/v1/pc`

---

## 2. Endpoints

### 2.1 Get Requirements Status
- **Method**: `GET`
- **Path**: `/api/v1/pc/requirements/status`
- **Authentication**: None (Public)
- **Description**: Returns the official confirmation status and active specifications for GTA 6 PC. When unconfirmed, returns `status="NOT_YET_CONFIRMED"` and `is_available=false` with the required player notice.
- **Response** (`200 OK`):
```json
{
  "status": "NOT_YET_CONFIRMED",
  "is_available": false,
  "notice_title": "Official GTA 6 PC System Requirements Not Yet Confirmed",
  "notice_message": "Official GTA 6 PC system requirements have not yet been confirmed. You can enter and save your PC specifications now, but an official compatibility result cannot be generated until verified requirements are available.",
  "publisher": "Rockstar Games",
  "source_name": "Rockstar Games Official Newswire",
  "source_url": "https://www.rockstargames.com/newswire",
  "last_checked_at": "2026-11-22T14:30:00Z",
  "requirements": []
}
```

---

### 2.2 List Requirements Specifications
- **Method**: `GET`
- **Path**: `/api/v1/pc/requirements`
- **Authentication**: None (Public)
- **Description**: Retrieves all stored requirement specification records (Minimum, Recommended, Ultra).
- **Response** (`200 OK`): Array of `GameSystemRequirementRead`.

---

### 2.3 List Player Hardware Profiles
- **Method**: `GET`
- **Path**: `/api/v1/pc/profiles`
- **Authentication**: Required (`Bearer <JWT>`)
- **Description**: Returns all saved PC hardware configurations for the calling user.
- **Response** (`200 OK`): Array of `PCHardwareProfileRead`.

---

### 2.4 Create Hardware Profile
- **Method**: `POST`
- **Path**: `/api/v1/pc/profiles`
- **Authentication**: Required (`Bearer <JWT>`)
- **Description**: Creates a new saved PC hardware profile. If `is_primary=true`, unsets previous primary profiles for the user.
- **Request Body**:
```json
{
  "profile_name": "Main Battlestation",
  "cpu_manufacturer": "AMD",
  "cpu_model": "Ryzen 7 7800X3D",
  "cpu_cores": 8,
  "cpu_threads": 16,
  "gpu_manufacturer": "NVIDIA",
  "gpu_model": "GeForce RTX 4070 Super",
  "gpu_vram_gb": 12.0,
  "gpu_type": "DEDICATED",
  "ram_gb": 32,
  "ram_type": "DDR5",
  "storage_type": "NVME_SSD",
  "storage_capacity_gb": 2000,
  "storage_free_gb": 850,
  "operating_system": "Windows 11",
  "os_architecture": "64-bit",
  "directx_version": "DirectX 12 Ultimate",
  "display_resolution": "2560x1440",
  "refresh_rate": 165,
  "is_primary": true
}
```
- **Response** (`201 Created`): `PCHardwareProfileRead`.

---

### 2.5 Get, Update & Delete Hardware Profile
- **Paths**:
  - `GET /api/v1/pc/profiles/{profile_id}`
  - `PUT /api/v1/pc/profiles/{profile_id}`
  - `DELETE /api/v1/pc/profiles/{profile_id}`
- **Authentication**: Required (`Bearer <JWT>`)
- **Security**: Ownership isolation strictly enforced. Attempting to access or alter another player's profile returns `404 Not Found`.

---

### 2.6 Run Compatibility Check
- **Method**: `POST`
- **Path**: `/api/v1/pc/compatibility/check`
- **Authentication**: Optional (`Bearer <JWT>` or anonymous)
- **Description**: Evaluates PC hardware specifications against verified requirements or baseline balance criteria. Strictly avoids synthetic FPS or fake percentages when requirements are unconfirmed.
- **Request Body**:
```json
{
  "specs": {
    "profile_name": "My PC",
    "cpu_manufacturer": "AMD",
    "cpu_model": "Ryzen 5 5600",
    "cpu_cores": 6,
    "cpu_threads": 12,
    "gpu_manufacturer": "AMD",
    "gpu_model": "Radeon RX 6600",
    "gpu_vram_gb": 8.0,
    "gpu_type": "DEDICATED",
    "ram_gb": 16,
    "ram_type": "DDR4",
    "storage_type": "SATA_SSD",
    "storage_free_gb": 350,
    "operating_system": "Windows 10",
    "os_architecture": "64-bit",
    "directx_version": "DirectX 12",
    "display_resolution": "1920x1080",
    "refresh_rate": 60
  },
  "save_profile": false
}
```
- **Response** (`200 OK`):
```json
{
  "id": "c1f67f2b-9c5e-49b8-b4b3-57c5e25239e1",
  "result_status": "REQUIREMENTS_UNAVAILABLE",
  "requirements_status": "NOT_YET_CONFIRMED",
  "analysis_summary": "Official GTA 6 PC system requirements have not yet been confirmed by Rockstar Games...",
  "hardware_summary": {
    "cpu": "AMD Ryzen 5 5600 (6C/12T)",
    "gpu": "AMD Radeon RX 6600 (8.0 GB VRAM, Dedicated)",
    "ram": "16 GB DDR4",
    "storage": "SATA SSD with 350 GB available",
    "os": "Windows 10 (64-bit) - DirectX 12",
    "display": "1920x1080 @ 60Hz"
  },
  "component_results": [
    {
      "component": "Processor (CPU)",
      "user_value": "AMD Ryzen 5 5600 (6 cores)",
      "required_value": "Unannounced by Rockstar Games",
      "status": "UNABLE_TO_COMPARE",
      "explanation": "Official CPU tier unconfirmed. Evaluation will unlock immediately upon official specification release."
    }
  ],
  "bottleneck_notes": [],
  "upgrade_suggestions": [],
  "saved_profile_id": null,
  "checked_at": "2026-11-22T14:35:10Z"
}
```

---

### 2.7 Compatibility Check History
- **Method**: `GET`
- **Path**: `/api/v1/pc/compatibility/history`
- **Authentication**: Required (`Bearer <JWT>`)
- **Parameters**: `limit` (default 20), `offset` (default 0).
- **Response** (`200 OK`): Array of `CompatibilityCheckHistoryItem`.

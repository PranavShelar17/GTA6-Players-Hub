# PC Hardware & Compatibility Data Model Documentation

## 1. Relational Database Schema

The PC Compatibility system utilizes three primary tables in PostgreSQL, complete with UUID primary keys, temporal timestamps, foreign key relationships, and indexes.

### Table: `pc_hardware_profiles`
Stores player-submitted or saved PC specifications. Supports multiple saved rigs per player with a primary rig indicator.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | No | - | Foreign Key to auth.users (indexed) |
| `profile_name` | VARCHAR(100) | No | `'My Gaming Rig'` | Custom label for the PC configuration |
| `cpu_manufacturer` | VARCHAR(50) | No | - | Intel, AMD, Other |
| `cpu_model` | VARCHAR(150) | No | - | Processor marketing model |
| `cpu_cores` | INTEGER | Yes | NULL | Number of physical CPU cores |
| `cpu_threads` | INTEGER | Yes | NULL | Number of logical threads |
| `gpu_manufacturer` | VARCHAR(50) | No | - | NVIDIA, AMD, Intel, Other |
| `gpu_model` | VARCHAR(150) | No | - | Graphics card model |
| `gpu_vram_gb` | NUMERIC(5,1) | No | - | Dedicated Video Memory in Gigabytes |
| `gpu_type` | VARCHAR(20) | No | `'DEDICATED'` | `DEDICATED` or `INTEGRATED` |
| `ram_gb` | INTEGER | No | - | Total system memory capacity |
| `ram_type` | VARCHAR(20) | Yes | NULL | DDR3, DDR4, DDR5, Other |
| `storage_type` | VARCHAR(20) | No | `'NVME_SSD'` | `NVME_SSD`, `SATA_SSD`, `HDD` |
| `storage_capacity_gb` | INTEGER | Yes | NULL | Drive total capacity |
| `storage_free_gb` | INTEGER | No | - | Available free disk space |
| `operating_system` | VARCHAR(50) | No | `'Windows 11'` | Windows 11, Windows 10, etc. |
| `os_architecture` | VARCHAR(20) | No | `'64-bit'` | `64-bit`, `32-bit`, `Unknown` |
| `directx_version` | VARCHAR(20) | Yes | `'DirectX 12'` | DirectX version / feature level |
| `display_resolution` | VARCHAR(30) | No | `'1920x1080'` | 1080p, 1440p, 4K, etc. |
| `refresh_rate` | INTEGER | Yes | 60 | Monitor refresh rate in Hz |
| `is_primary` | BOOLEAN | No | `TRUE` | Whether this is the player's primary rig |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Profile last updated timestamp |

---

### Table: `game_system_requirements`
Stores verified system specifications released by Rockstar Games or authorized publisher sources.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `game_name` | VARCHAR(100) | No | `'Grand Theft Auto VI'` | Target game title |
| `platform` | VARCHAR(30) | No | `'PC'` | Platform target |
| `requirement_category`| VARCHAR(30) | No | - | `MINIMUM`, `RECOMMENDED`, `ULTRA` |
| `cpu_requirement` | VARCHAR(255) | Yes | NULL | Target processor model / family |
| `cpu_min_cores` | INTEGER | Yes | NULL | Minimum required physical cores |
| `gpu_requirement` | VARCHAR(255) | Yes | NULL | Target graphics card tier |
| `vram_requirement_gb`| NUMERIC(5,1) | Yes | NULL | Target VRAM capacity in GB |
| `ram_requirement_gb` | INTEGER | Yes | NULL | Target RAM capacity in GB |
| `storage_requirement_gb` | INTEGER | Yes | NULL | Required free drive space |
| `storage_type_requirement` | VARCHAR(50) | Yes | `'SSD Required'` | Storage media type target |
| `operating_system_requirement` | VARCHAR(100) | Yes | NULL | Target OS version & architecture |
| `directx_requirement`| VARCHAR(50) | Yes | `'DirectX 12'` | Target graphics API |
| `source_url` | VARCHAR(1024)| Yes | NULL | Official announcement URL |
| `source_name` | VARCHAR(100) | Yes | NULL | Official publisher / newswire name |
| `verification_status`| VARCHAR(32) | No | `'UNCONFIRMED'` | `OFFICIAL`, `VERIFIED`, `UNCONFIRMED` |
| `is_active` | BOOLEAN | No | `FALSE` | Set TRUE only when officially confirmed |
| `notes` | TEXT | Yes | NULL | Official explanatory notes & caveats |
| `published_at` | TIMESTAMPTZ | Yes | NULL | Publisher publication timestamp |
| `last_verified_at` | TIMESTAMPTZ | No | `NOW()` | Timestamp of last manual/crawler verification |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Record update timestamp |

---

### Table: `pc_compatibility_checks`
Audit log of compatibility and balance evaluations performed by players or anonymous visitors.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | No | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | Yes | NULL | Player ID if logged in (NULL for anonymous) |
| `hardware_profile_id`| UUID | Yes | NULL | Linked hardware profile FK (SET NULL on delete) |
| `requirements_version_id` | UUID | Yes | NULL | Target requirements version FK |
| `result_status` | VARCHAR(50) | No | `'REQUIREMENTS_UNAVAILABLE'` | Overall compatibility tier |
| `component_results` | JSONB / JSON | No | `'[]'` | List of component evaluation objects |
| `hardware_summary` | JSONB / JSON | No | `'{}'` | Snapshot of evaluated system specifications |
| `bottleneck_notes` | JSONB / JSON | No | `'[]'` | List of objective hardware balance notes |
| `upgrade_suggestions` | JSONB / JSON | No | `'[]'` | List of tailored upgrade considerations |
| `analysis_summary` | TEXT | No | - | Detailed human-readable diagnostic statement |
| `checked_at` | TIMESTAMPTZ | No | `NOW()` | Timestamp check was conducted |

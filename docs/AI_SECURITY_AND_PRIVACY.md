# AI Security & Data Privacy Policy (Phase 9)
**GTA 6 Player Hub – Security Specification**
**Date**: November 22, 2026

---

## 1. Data Privacy Principles

The AI Gaming Problem Solver is built with privacy-by-design standards:
1. **No Sensitive PII Collection**: Hardware sharing is strictly opt-in and restricted to high-level component model names (CPU, GPU, RAM, OS architecture). The system never collects or transmits IP addresses, MAC addresses, device serial numbers, Windows product keys, or personal file directory structures.
2. **Explicit Consent Gate**: The frontend requires explicit user consent before attaching any hardware specifications to a diagnostic conversation session.
3. **Player Ownership of Conversations**: Players have full sovereign control over their troubleshooting history, including one-click deletion of conversations and messages.
4. **Row-Level Security (RLS)**: Conversations and feedback records stored in Supabase PostgreSQL enforce strict ownership policies preventing unauthorized cross-user access.

---

## 2. Technical Safety & Harm Prevention Safeguards

1. **System Integrity Protection**: The AI refuses to instruct players to disable security software permanently (Windows Defender, antivirus, firewalls) or to run unverified `.bat` / `.ps1` / `.exe` binaries downloaded from unknown file shares.
2. **Safe Registry & Command Warnings**: Whenever Windows Registry changes or administrative commands (`sfc /scannow`, `DISM`, `netsh`) are discussed, the assistant includes explicit backup procedures (`regedit` export) and safety cautions.
3. **Anti-Leak Safeguards**: The assistant strictly blocks prompts designed to extract underlying system instructions, API keys, or database credentials.
4. **Community Feedback Auditing**: The platform includes a player feedback mechanism (Helpful, Not Helpful, Report Response) that logs reported responses with categories for engineering audit and continuous refinement.

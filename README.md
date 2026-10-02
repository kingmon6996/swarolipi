# Swarolipi — Technical & Functional Documentation (`doc.md`)

## Overview

**Swarolipi** is a privacy-first digital identity and human verification platform built for Web3 and Ethereum/EVM applications.

In decentralized applications, a crypto wallet address proves ownership of digital assets, but it cannot prove whether the owner is a real human or an automated bot. Swarolipi solves this by adding a privacy-conscious "human layer" to Web3 wallets. 

> **Core Philosophy**: **"Verify Once via Voice, Authorize Anywhere Forever."**

A user completes voice verification **exactly ONCE**. Once verified, a permanent cryptographic **Human-Verified Credential** is bound to their wallet. Third-party applications can immediately verify the user's human status without requiring the user to record their voice again.

---

## Problem Statement

Web3 wallet addresses prove digital asset ownership but cannot verify human identity, forcing users through repetitive, privacy-intrusive KYC while leaving dApps exposed to bot manipulation and Web3 phishing.

---

## Proposed Solution

Swarolipi establishes a privacy-first human layer for Web3 based on **"Verify Once via Voice, Authorize Anywhere Forever"**:

1. **One-Time Voice Verification**: ElevenLabs AI verifies human liveness once to issue a permanent wallet-bound credential, blocking bots.
2. **Zero-Knowledge Identity Hashing**: Python Flask engine generates deterministic identity hashes with zero raw PII storage.
3. **Scoped Authorization & Phishing Protection**: Self-expiring dApp permissions and a trust-rated Web3 mailbox prevent phishing.

---


## MSP (Main Solution Proposition) & USP (Unique Selling Proposition)

### MSP (Main Solution Proposition / Core MVP Scope)
- **Unified Identity & Authorization Pipeline**: Connect an Ethereum wallet $\rightarrow$ Complete a one-time 3-sentence voice challenge (ElevenLabs Agent + Custom Voice Analysis Engine) $\rightarrow$ Process credentials via a deterministic Python Flask hashing algorithm $\rightarrow$ Authorize 3rd-party dApps with self-expiring scopes $\rightarrow$ Send and receive verified notifications in a Web3 Mailbox.

### USP (Unique Selling Proposition)
1. **"Verify Once, Authorize Anywhere"**: Frictionless Web3 onboarding. Users verify their voice **only once**, eliminating repetitive KYC or voice recording when logging into multiple dApps.
2. **ElevenLabs Interactive Anti-Deepfake Liveness**: Live 3-sentence challenge generation by an ElevenLabs AI Voice Agent prevents pre-recorded audio replays and synthetic voice clones from spoofing identity verification.
3. **Zero-Knowledge Python Identity Hashing**: Converts `Name + DOB + Document ID` into a deterministic hash via a Python Flask API. Raw personal data is **never stored anywhere**, while the shared hash provides anonymized alternative Single Sign-On (SSO) for 3rd-party dApps.
4. **Trust-Rated Web3 Mailbox**: Eliminates Web3 phishing by categorizing inbox messages by cryptographic trust levels (`verified_app`, `verified_wallet`, `unknown_wallet`).

---

## Tech Stack Overview

- **Frontend Application**: React 19, TanStack Start (SSR/Vite), TanStack Router & Query, Tailwind CSS v4, Lucide Icons, Framer Motion.
- **Voice AI & Liveness Engine**: ElevenLabs Conversational AI Agent SDK (`@elevenlabs/react`) paired with Web Audio DSP noise cancellation.
- **Python Backend Engine**: **Flask REST API** implementing deterministic identity hashing (`SHA-256` / `Poseidon`) for `Name + DOB + Document ID` processing with zero data retention.
- **Web3 & Smart Contracts**: Ethereum Sepolia Testnet, EIP-1193 (MetaMask), WalletConnect v2, EIP-712 typed data signatures, Solidity contract integrations.

---

## Core Modules & How It Works

### 1. Web3 Wallet Connection & Pseudonymous Profile
- Connects with major Ethereum and EVM-compatible Web3 wallets (MetaMask, WalletConnect).
- Uses the public wallet address to establish a secure user session.
- Automatically assigns a readable pseudonym and avatar (e.g. *Silent Falcon*) so users remain identifiable within the ecosystem while keeping their real-world identity private.

### 2. One-Time Voice Verification Pipeline (ElevenLabs + Voice Analysis Engine)
During initial onboarding, the user undergoes a single interactive voice verification challenge.

* **Step-by-Step Workflow**:
  1. **Adaptive Audio Noise Cancellation**: An in-browser Web Audio DSP preprocessing module normalizes audio levels and filters out background noise/echoes before processing.
  2. **Voice Interface & Human Challenge Generation**: An **ElevenLabs Conversational Voice Agent** initiates an interactive session and prompts the user to repeat **3 randomly generated sentences**.
  3. **User Speech Input**: The user speaks the 3 challenge sentences into the microphone interface.
  4. **Custom Voice Analysis Engine**: A custom-built voice analysis engine evaluates:
     - **Liveness Signals**: Pitch modulation, vocal dynamics, and human spectral characteristics.
     - **Replay Attack Detection**: Detects playback latency anomalies or pre-recorded audio feeds.
     - **Voice Analysis**: Performs acoustic feature extraction and spectral analysis.
  5. **Verification Scoring**:
     - Computes a verification score against a security threshold.
     - **Score $\ge$ Threshold ($\rightarrow$ VERIFIED)**: A permanent cryptographic **Wallet Proof Credential** is issued for the Ethereum wallet. The user never needs to record or verify their voice again.
     - **Score $<$ Threshold ($\rightarrow$ FAILED)**: The user is prompted to retry or rejected.

### 3. Privacy-Preserving Identity Hashing Algorithm (Python Flask Engine)
- A dedicated **Python Flask REST API** processes government ID fields (`User Name + Date of Birth + Document ID`).
- Applies a standardized cryptographic hashing function (e.g. salted SHA-256 / Poseidon hash) to produce a unique, deterministic digital fingerprint.
- **Zero Data Retention**: No personal data (name, date of birth, or document numbers) is ever stored in any database or on-chain.
- **Emergency Account Freeze & Biometric Wallet Migration**: If a user's Ethereum wallet key is stolen, re-running credentials through the Python Flask engine produces their matching deterministic hash, allowing them to **freeze the compromised account** and safely migrate their verified status and authorized app list to a new Ethereum wallet.

### 4. Third-Party dApp Authorization Gateway & Shared Hash SSO
Functions as a decentralized permission gateway (similar to OAuth for Web3) for external applications (e.g., DAOs, voting protocols, marketplaces).

* **Permission Scopes**:
  - **Public Profile**: Access pseudonym and avatar.
  - **Wallet Control**: Verify wallet ownership.
  - **Humanity Badge**: Confirm human verification status.
  - **Identity Badge**: Confirm identity status.
* **Time-Bounded & Scope-Expiring Authorizations**:
  - Users can set self-expiring permission windows (e.g. *"Authorize for 24 hours"* or *"Authorize for 1 single vote"*).
  - Once the time window or transaction count expires, the Swarolipi gateway automatically revokes access.
* **Identity Hash Sharing & Alternative SSO**:
  - When a user grants permission to an authorized 3rd party dApp, Swarolipi securely passes the anonymized **identity hash** to the requesting application.
  - If the 3rd party dApp finds a matching identity hash in its existing database, it serves as an **alternative single sign-on (SSO) / account recognition** method for the dApp without exposing raw personal data.

### 5. Privacy-Safe Trust & Reputation Score (API Protocol)
- Calculates a quantitative Trust Score (0–100) based on:
  - **Voice Verification**: +40 pts
  - **Identity Hash Credential**: +40 pts
  - **Wallet On-Chain Account Age**: +20 pts
- **API Integration**: Third-party dApps query Swarolipi via simple REST/GraphQL endpoints (`GET /api/v1/verify/:walletAddress`) to check if a wallet meets their minimum required Trust Score threshold (e.g. Trust Score $\ge$ 75 required for governance voting).

### 6. Verified Web3 Mailbox & Messaging
- A built-in decentralized messaging system for communication between wallets and authorized applications.
- **Trust Levels**:
  - **Verified Application**: System notices and alerts from authorized dApps (e.g., VoteDAO).
  - **Verified Wallet**: Direct peer-to-peer messages from other human-verified wallet holders.
  - **Unverified Wallet**: Messages from unverified accounts, clearly flagged to prevent spam and phishing.
- **Actionable Notifications**: Messages include interactive buttons (e.g. "Review Authorization" or "Complete Verification").

### 7. Developer Sandbox & ElevenLabs Conversational Voice Assistant
- Located at `/developer/demo`, the sandbox allows external dApp builders to test authorization requests, query verification signals, and simulate callbacks.
- **ElevenLabs AI Voice Assistant for Solidity Developers**:
  - Developers can converse live with an **ElevenLabs Conversational AI Agent** directly inside the portal.
  - Developers ask questions via voice (e.g., *"How do I import Swarolipi.sol into my Remix / Hardhat Solidity project?"* or *"Generate a Solidity modifier for verifying human status on Ethereum Sepolia Testnet"*).
  - The ElevenLabs voice agent responds verbally in real time while generating and rendering the exact Solidity smart contract code snippets and ABI on screen.

---

## End-to-End User Flow

```
┌───────────────────────────┐
│   1. Connect Wallet       │  User connects Ethereum wallet & receives a pseudonymous profile
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐  Audio noise filtering -> ElevenLabs Voice Agent prompts 3 random sentences;
│   2. Voice Verification   │  Custom Voice Analysis Engine evaluates liveness & scores audio
└─────────────┬─────────────┘  (Performed ONCE during onboarding)
              │
              ▼
┌───────────────────────────┐  Python Flask API generates deterministic hash from Name + DOB + Document ID
│   3. Identity Hashing     │  (Zero raw personal data stored; allows emergency wallet migration)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐  dApps request permissions with time-bounded expiration;
│   4. Authorize dApps      │  Swarolipi shares anonymized identity hash for alternative 3rd party SSO
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐  3rd-party dApps query Trust Score API (0–100);
│   5. API & Mailbox        │  Developers use ElevenLabs AI Voice Assistant to integrate Solidity smart contracts
└───────────────────────────┘
```

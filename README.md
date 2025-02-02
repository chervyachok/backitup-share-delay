# BuckItUp Community-secret-sharing Web App

**Stealth Recovery** is a web application that provides secure local storage and recovery of user credentials, encrypted secrets, and wallet backups. It leverages modern cryptographic techniques (including Shamir’s Secret Sharing) and decentralized technologies (smart contracts, Lit Protocol) to allow users to protect and recover their digital assets and private data—all while keeping sensitive information encrypted locally in the browser.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [How It Works](#how-it-works)
  - [Account Creation & Local Data Encryption](#account-creation--local-data-encryption)
  - [Meta Address Registration & Stealth Address Generation](#meta-address-registration--stealth-address-generation)
  - [Encrypted Secret Sharing & Recovery](#encrypted-secret-sharing--recovery)
  - [Backup & Notice Management](#backup--notice-management)
  - [Trusted Parties & QR Handshake](#trusted-parties--qr-handshake)
  - [Relay Transactions via Server-Side Script](#relay-transactions-via-server-side-script)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- **Account Creation with Passkey:**  
  Create an account with a passkey that doubles as an encryption key. This key is used to encrypt and store credentials and other sensitive data locally in the browser (using IndexedDB).

- **Local Data Encryption:**  
  User credentials, settings, and other sensitive data are encrypted client-side using robust encryption (e.g., Blowfish in CFB mode) before being stored in IndexedDB.

- **Meta Address Registration:**  
  After login, users register their meta address. This address is used for future stealth address generation and serves as a digital identity for interacting with smart contracts.

- **Stealth Address Generation:**  
  Generate stealth addresses to enhance privacy. The app can calculate and verify if a stealth address belongs to the user’s wallet.

- **Encrypted Secret Sharing with Shamir’s Algorithm:**  
  Users can create encrypted secrets (e.g., a private key) and share them securely with trusted parties using Shamir’s Secret Sharing scheme. A threshold of trusted parties is required to recover the secret.

- **Smart Contract Storage:**  
  The shared secret (or its shares) is stored on a blockchain smart contract, ensuring decentralization and tamper-resistance.

- **Restore Delay & Lit Protocol Integration:**  
  Users can set a restore delay for secret recovery. If the delay passes without owner intervention (or explicit decline), trusted parties can restore their share. This mechanism is implemented with the help of the Lit Protocol.

- **Backup Discovery & Management:**  
  Users can find wallet backups by verifying if a stealth address belongs to them. Both owners and trusted parties have views into their respective backup lists.

- **Encrypted Notices:**  
  The owner can create encrypted notices for themselves or send them to each trusted party. Restoration requests (via transactions) provide the owner time to react if the delay is set.

- **Flexible Trusted Party Addition:**  
  Trusted parties can be added manually by wallet address or via a QR handshake process, where users exchange signatures, public keys, and names.

- **Relay Transactions:**  
  A server-side script is used to relay transactions between users, allowing users to interact with the network without needing a wallet balance.

## Architecture Overview

The app consists of the following key components:

1. **Client-Side Web App:**  
   - **Encryption & Local Storage:** Uses the browser’s IndexedDB to store user data encrypted with the user’s passkey.
   - **User Interface:** Built with a modern frontend framework (e.g., Vue.js) to manage account creation, secret sharing, backup restoration, and trusted party management.
  
2. **Decentralized Components:**  
   - **Smart Contracts:** Store secret shares and backup metadata on-chain.
   - **Lit Protocol:** Enforces restore delays and conditional access to secret shares.
  
3. **Server-Side Relay:**  
   - A lightweight relay server (using Node.js or similar) that broadcasts transactions on behalf of users, removing the need for users to hold native blockchain tokens.

## How It Works

### Account Creation & Local Data Encryption

- **User Registration:**  
  A user creates an account with a passkey. This passkey is used as an encryption key to secure user credentials and sensitive data.
- **Local Storage:**  
  Encrypted data is stored in the browser’s IndexedDB, ensuring that all sensitive information remains local unless explicitly shared.

### Meta Address Registration & Stealth Address Generation

- **Meta Address:**  
  After login, users register a meta address. This acts as their public identity on the platform.
- **Stealth Addresses:**  
  The app generates stealth addresses for increased privacy. Users can verify whether a stealth address belongs to their wallet through calculation methods embedded in the app.

### Encrypted Secret Sharing & Recovery

- **Secret Creation & Sharing:**  
  Users can create an encrypted secret (for example, a private key) and split it into shares using Shamir’s Secret Sharing algorithm.
- **Threshold Setting:**  
  The user defines a threshold for recovery (e.g., at least 3 out of 5 trusted parties must combine their shares).
- **Smart Contract Storage:**  
  Shares are stored on-chain via smart contracts. The smart contract holds the encrypted shares until a recovery is triggered.
- **Restore Delay:**  
  A configurable delay prevents premature recovery. If the owner does not decline a read request during the delay, trusted parties can recover their share.
- **Lit Protocol:**  
  This protocol enforces the delay and controls the conditional release of secret shares.

### Backup & Notice Management

- **Wallet Backup Discovery:**  
  Users can compute and verify if stealth addresses belong to them, helping in wallet backup discovery.
- **Encrypted Notices:**  
  The owner may create encrypted notices for self-reminders or send them to trusted parties. These notices help manage backup recovery and communication regarding secret sharing.

### Trusted Parties & QR Handshake

- **Trusted Party Registration:**  
  Trusted parties can be added manually (by wallet address) or via a QR handshake. In the handshake process, users exchange signatures, public keys, and names to establish trust.
- **Threshold Recovery:**  
  During recovery, the combined shares from the trusted parties meeting the threshold are used to reconstruct the secret.

### Relay Transactions via Server-Side Script

- **Transaction Relay:**  
  A server-side relay script broadcasts transactions on behalf of users. This allows users to initiate recovery or share requests without needing to hold cryptocurrency for transaction fees.

## Technology Stack

- **Frontend:**  
  - Vue.js (or your preferred framework)
  - IndexedDB for local storage
  - Standard web technologies: HTML, CSS, JavaScript

- **Encryption:**  
  - Blowfish encryption in CFB mode (or an alternative secure algorithm)
  - Shamir’s Secret Sharing algorithm

- **Blockchain Integration:**  
  - Smart contracts for storing secret shares and metadata
  - Lit Protocol for conditional access control and restore delays

- **Server-Side:**  
  - Node.js (or equivalent) for transaction relay services

## Installation & Setup

### Prerequisites

- Node.js (for development and server-side relay)
- npm or yarn package manager

### Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/stealth-recovery.git
   cd stealth-recovery

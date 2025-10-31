# ZK Password Manager

A zero-knowledge password manager where your passwords are encrypted before they leave your browser. The server never sees your actual passwords. This is additionally built featuring biometric authentication, Shamir's Secret Sharing for account recovery, and comprehensive security measures.

## What it does

The application stores your passwords encrypted in a database. The encryption happens on your computer before anything gets sent to the server, so even if database is compromised, they can't read your passwords.

## Features

- Password
- Biometric (fingerprint or face recognition)

- Zero-Knowledge: All encryption/decryption happens client-side
- End-to-End Encryption: Passwords are encrypted before leaving the browser
- Biometric Authentication: Biometric support for secure login
- Shamir's Secret Sharing: Distributed account recovery system
- Brute Force Protection: Account locking after failed attempts

### Authentication & Recovery

- Multi-Factor Authentication: Utilizing password and biometrics
- Account Recovery: Utilizing Shamir's Secret Sharing with trusted contacts
- Secure JWT-based sessions for session management
- Activity logging for audit trail

## Architecture

Project structure:

- `app/` - Next.js App Router
  - `api/` - API routes
    - `auth/` - Authentication endpoints (login, register, biometric)
    - `shamir/` - Secret sharing endpoints
    - `vault/` - Password vault endpoints
  - `components/` - React components
  - `lib/` - Utility libraries
  - Pages - Dashboard, vault, login, register
- `public/` - Static assets

## Technology Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: MongoDB
- Authentication: WebAuthn, JWT
- Encryption: Web Crypto API, Shamir's Secret Sharing

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB account
- Modern browser with WebAuthn support

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd zk-password-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the project root:

```env
# Database Configuration

MONGODB_URI=mongodb+srv://examplemongodb.net/?retryWrites=&w=majority
MONGODB_DB_NAME=zk-password-manager


# JWT Configuration
NEXT_PUBLIC_JWT_SECRET=your-super-secret-jwt-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Start the dev server:

```bash
npm run dev
```

Then go to `http://localhost:3000`.

## Development

#### Core libs (`app/lib/`)

- `crypto.ts` - Client-side encryption utilities
- `jwt.ts` - JWT token management
- `shamir.ts` - Shamir's Secret Sharing implementation
- `mongodbClient.ts` - MongoDB client configuration
- `zkp.ts` - Zero-knowledge proof utilities

#### 1. Zero-Knowledge Architecture

- All encryption/decryption performed client-side
- Server never sees plaintext passwords
- Uses Web Crypto API for secure operations

#### 2. Biometric Authentication

- WebAuthn integration for fingerprint/face recognition
- Fallback to password authentication
- Secure credential storage

#### 3. Shamir's Secret Sharing

- Configurable threshold and share count
- Distributed recovery among trusted contacts
- Secure share generation and validation

## Database Schema

### Core Tables

- `users` - User accounts and authentication data
- `password_entries` - Encrypted password vault entries
- `activity_logs` - User activity tracking
- `recovery_shares` - Shamir secret sharing data
- `recovery_attempts` - Failed recovery attempt logging

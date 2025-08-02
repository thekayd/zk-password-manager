# ZK Password Manager

A zero-knowledge password manager with biometric authentication and Shamir's Secret Sharing recovery.

## Features

- Zero-knowledge password storage
- Biometric authentication (WebAuthn)
- Shamir's Secret Sharing for account recovery
- Brute force protection
- Activity logging

## Database Setup

This project uses MongoDB instead of Supabase. Follow these steps to set up:

### 1. Install MongoDB

**macOS:**

```bash
brew install mongodb-community
```

**Ubuntu/Debian:**

```bash
sudo apt-get install mongodb
```

**Windows:**
Download from [mongodb.com](https://www.mongodb.com/try/download/community)

### 2. Start MongoDB

```bash
# Start MongoDB service
mongod
```

### 3. Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=zk-password-manager

# JWT Secret (uses existing implementation)
NEXT_PUBLIC_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Collections

The MongoDB database will automatically create these collections:

- `users` - User authentication and profile data
- `password_entries` - Encrypted password vault entries
- `vaults` - Encrypted vault data
- `activity_logs` - User activity tracking
- `recovery_shares` - Recovery share data
- `shamir_shares` - Shamir secret sharing metadata
- `recovery_attempts` - Recovery attempt logging
- `recovery_agents` - Trusted recovery contacts

## Authentication

Uses custom JWT implementation with Web Crypto API for secure token generation and verification.

## Security Features

- Zero-knowledge architecture
- Biometric authentication via WebAuthn
- Shamir's Secret Sharing for account recovery
- Brute force protection with account locking
- Activity logging and monitoring

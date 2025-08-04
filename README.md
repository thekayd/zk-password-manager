# ZK Password Manager - Alpha

A zero-knowledge password manager built with Next.js, featuring biometric authentication, Shamir's Secret Sharing for account recovery, and comprehensive security measures.

## Alpha Release

This is an **Alpha** version of the ZK Password Manager. The application is functional but may contain bugs and incomplete features. Use at your own risk and do not store critical passwords until the stable release.

## ✨ Features

### Core Security

- **Zero-Knowledge Architecture**: All encryption/decryption happens client-side
- **End-to-End Encryption**: Passwords are encrypted before leaving the browser
- **Biometric Authentication**: WebAuthn support for secure login
- **Shamir's Secret Sharing**: Distributed account recovery system
- **Brute Force Protection**: Account locking after failed attempts

### Authentication & Recovery

- **Multi-Factor Authentication**: Password + Biometric
- **Account Recovery**: Shamir's Secret Sharing with trusted contacts
- **Session Management**: Secure JWT-based sessions
- **Activity Logging**: Comprehensive audit trail

### User Experience

- **Modern UI**: Built with Next.js and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live vault synchronization
- **Password Generation**: Secure random password creation

## Architecture

```
zk-password-manager/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── shamir/        # Secret sharing endpoints
│   │   └── vault/         # Password vault endpoints
│   ├── components/        # React components
│   ├── lib/              # Utility libraries
│   └── pages/            # Application pages
├── supabase/             # Database migrations & functions
└── public/               # Static assets
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: WebAuthn, JWT
- **Encryption**: Web Crypto API, Shamir's Secret Sharing
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
NEXT_PUBLIC_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

Run the Supabase migrations:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔧 Development

### Project Structure

#### Core libs (`app/lib/`)

- `crypto.ts` - Client-side encryption utilities
- `jwt.ts` - JWT token management
- `shamir.ts` - Shamir's Secret Sharing implementation
- `supabaseClient.ts` - Supabase client configuration
- `zkp.ts` - Zero-knowledge proof utilities

#### API Routes (`app/api/`)

- **Authentication**: Login, register, biometric auth, logout
- **Vault Management**: CRUD operations for password entries
- **Shamir Recovery**: Secret sharing and recovery workflows
- **Activity Logging**: User activity tracking

#### Components (`app/components/`)

- `AuthCheck.tsx` - Authentication guard component
- `BiometricModal.tsx` - WebAuthn authentication modal
- `VaultEntry.tsx` - Password entry display component
- `ShareGenerator.tsx` - Shamir share generation UI
- `ShareInput.tsx` - Recovery share input component

### Key Features Implementation

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

### Row Level Security (RLS)

- All tables protected with RLS policies
- Users can only access their own data
- Secure multi-tenant architecture

## Security Considerations

### Alpha Limitations

- **Not Production Ready**: This is an alpha release
- **Limited Testing**: Comprehensive security audit pending
- **Feature Completeness**: Some features may be incomplete
- **Documentation**: API documentation may be outdated

## Contributing

This is an alpha release. Contributions are welcome but please note:

1. **Alpha Status**: Features may change rapidly
2. **Security Focus**: All contributions must maintain security standards
3. **Testing**: Comprehensive testing required for all changes
4. **Documentation**: Update documentation with any changes

## License

## Support

For alpha release support:

- Create issues for bugs or feature requests
- Check existing issues before creating new ones
- Provide detailed reproduction steps for bugs

## Roadmap

### Beta Release (Planned)

- [ ] Comprehensive security audit
- [ ] Penetration testing
- [ ] Performance optimization
- [ ] Enhanced UI/UX
- [ ] Mobile app development
- [ ] API documentation

### Stable Release (Future)

- [ ] Production deployment
- [ ] Enterprise features
- [ ] Team collaboration
- [ ] Advanced recovery options

---

**Alpha Warning**: This software is provided as-is for testing purposes. Do not use for storing critical passwords until the stable release.

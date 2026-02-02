# Indian Independent Journalists Network (IIJN)

🏗️ Platform-Independent Journalism + Journalist Association

## Overview

The Indian Independent Journalists Network (IIJN) is a comprehensive platform designed to empower independent journalists with platform-independent infrastructure, verified profiles, case management, and direct public engagement. Built with Next.js 16, TypeScript, and modern web technologies.

## 🎯 Mission

"IIJN ensures that independent journalists can report the truth, protect the public interest, and survive platform disruptions, all while remaining part of a credible national network."

## ✨ Key Features

### 1. Platform-Independent Infrastructure
- **Central Website** – Primary archive for all reporting and cases
- **PWA Support** – Works offline, bypasses Play Store dependency
- **Email Bulletins** – Direct communication with public
- **Social Media Mirroring** – Teasers only, never source of truth

### 2. Case-Based Journalism System
- **Case File Management** – Each news story = individual case
- **Timeline Tracking** – All developments logged chronologically
- **Document Uploads** – RTI, FIRs, notices, government documents, videos
- **Follow-ups & Updates** – Transparent reporting of progress
- **Authority Tagging** – Police, officials, institutions linked to cases

### 3. Verified Journalist Profiles
- **Membership ID** – Verified journalist identity
- **Profile Pages** – Publications, case ownership, area of coverage
- **Public Accountability** – Readers can see all work tied to a journalist
- **Mentorship System** – Senior journalists guide new reporters

### 4. Trust & Verification Layer
- **Source Disclosure** – Verified sources for each report
- **Evidence-First Reporting** – News backed by documents & media
- **Correction History** – Transparent record of updates
- **Community Verification** – Public flags or verifies reports

### 5. Public-Focused Features
- **Direct Case Access** – Citizens can read, follow, or subscribe
- **Alerts & Notifications** – Important issues delivered directly
- **Subscription System** – Support investigative journalism
- **Issue-Based Filtering** – Search by region, case type, governance issue

## 🛠 Technology Stack

### Core Framework
- **Next.js 16** with App Router
- **TypeScript 5** for type safety
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library

### Database & Authentication
- **Prisma ORM** with SQLite
- **NextAuth.js v4** for authentication
- **bcryptjs** for password hashing

### Additional Libraries
- **Zod** for schema validation
- **React Hook Form** for form management
- **TanStack Query** for server state
- **Zustand** for client state
- **Lucide React** for icons

## 📋 Database Schema

The platform uses a comprehensive database schema with the following key models:

- **Users** - Authentication and role management
- **Journalist Profiles** - Verified journalist information
- **Cases** - Individual journalism cases with full metadata
- **Case Timeline** - Chronological event tracking
- **Documents** - Evidence and supporting materials
- **Sources** - Source management and verification
- **Authorities** - Institution and official tagging
- **Publications** - Journalist portfolio management
- **Verifications** - Multi-layer trust system
- **Audit Logs** - Complete activity tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Bun package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jitenkr2030/IIJ-Network.git
   cd IIJ-Network
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   bun run db:push
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── cases/         # Case management endpoints
│   ├── cases/             # Case-related pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── navigation.tsx    # Main navigation
│   └── footer.tsx        # Site footer
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── auth-helpers.ts  # Authentication helpers
│   ├── db.ts            # Prisma client
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## 🔐 Authentication & Authorization

The platform implements role-based access control:

- **PUBLIC** - Can view public cases and subscribe
- **JOURNALIST** - Can create and manage cases, upload documents
- **MODERATOR** - Can review and moderate content
- **ADMIN** - Full system access

## 📱 Mobile & PWA Support

The platform includes Progressive Web App capabilities:
- Offline functionality for critical features
- Mobile-optimized responsive design
- App-like experience on mobile devices
- Push notifications (planned)

## 🔒 Security Features

- **End-to-End Encryption** – Protect journalist and source identity
- **Document Backups** – Cloud + local redundancy
- **Audit Trails** – Every edit and upload logged
- **Source Protection** – Anonymous source options
- **Platform Independence** – Data hosted on owned servers

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Case Management Endpoints
- `GET /api/cases` - List cases with filtering
- `POST /api/cases` - Create new case
- `GET /api/cases/[id]` - Get case details
- `PUT /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case
- `GET /api/cases/by-slug/[slug]` - Get case by slug

## 🧪 Development

### Available Scripts
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Run ESLint
- `bun run db:push` - Push schema changes to database
- `bun run db:generate` - Generate Prisma client

### Code Quality
- ESLint configuration for Next.js
- TypeScript strict mode
- Prisma for type-safe database access
- Component-driven architecture

## 📊 Current Status

### ✅ Completed Features
- [x] Comprehensive database schema
- [x] Authentication system with role-based access
- [x] Case management system (CRUD operations)
- [x] Responsive UI with navigation and footer
- [x] Case listing with filtering and search
- [x] Case creation and detail views
- [x] Journalist profile system foundation

### 🚧 In Progress
- [ ] Document upload system
- [ ] Case timeline management
- [ ] Source verification system
- [ ] Public subscription features

### 📋 Planned Features
- [ ] Admin dashboard
- [ ] Email notification system
- [ ] Advanced search and filtering
- [ ] Mobile app development
- [ ] Payment/subscription system
- [ ] Social media integration
- [ ] Analytics and reporting

## 🤝 Contributing

We welcome contributions to the IIJN platform! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write TypeScript for all new code
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Independent journalists across India who inspired this platform
- The open-source community for the amazing tools and libraries
- All contributors who help make independent journalism stronger

## 📞 Contact

- **Email**: contact@iijn.org
- **Website**: https://iijn.org
- **GitHub**: https://github.com/jitenkr2030/IIJ-Network

## 🔮 Future Roadmap

### Phase 1 (Current)
- Core case management
- Basic journalist verification
- Public case browsing

### Phase 2 (Next 3 months)
- Document management system
- Advanced timeline features
- Email notifications
- Mobile PWA improvements

### Phase 3 (6 months)
- Admin dashboard
- Payment/subscription system
- Advanced analytics
- Social media integration

### Phase 4 (12 months)
- Native mobile apps
- AI-powered content analysis
- Multi-language support
- International expansion

---

**Built with ❤️ for independent journalism in India**
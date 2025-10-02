# RefPaper 🤖📚

> Transform any documentation into intelligent AI assistants in seconds

RefPaper is a cutting-edge SaaS platform that revolutionizes the way to interact with documentation by converting static docs (any web page!) into conversational **AI assistants**. Built with modern serverless architecture, it provides instant access to knowledge through natural language conversations.

![RefPaper Platform](https://img.shields.io/badge/Platform-Next.js%2015-black?style=for-the-badge&logo=next.js)
![Backend](https://img.shields.io/badge/Backend-Convex-purple?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4-green?style=for-the-badge&logo=openai&width=32)
![Vector DB](https://img.shields.io/badge/Vector%20DB-Pinecone-blue?style=for-the-badge)
![Auth](https://img.shields.io/badge/Auth-Clerk-orange?style=for-the-badge)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/pnpm
- **Convex** account and project
- **OpenAI** API key
- **Pinecone** account and index
- **Firecrawl** account
- **Clerk** authentication setup
- **Resend** account for emails

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/refpaper.git
cd refpaper

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure Convex
npx convex dev

# Start development server
npm run dev
```

### Environment Variables

```env
# Convex
CONVEX_DEPLOYMENT=your_deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_FRONTEND_API_URL=your_clerk_api_url

# OpenAI Services
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=your_openai_model

# Pinecone Embedding
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=you_index_name
PINECONE_ENVIRONMENT=your_env_name
PINECONE_EMBEDDING_MODEL=text-your_embedding_model

# Web Crawling
FIRECRAWL_API_KEY=fc-...

# Email
RESEND_API_KEY=re_...
```

## 🏗️ Architecture Overview

RefPaper implements a modern serverless architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External APIs  │
│   (Next.js 15)  │◄──►│   (Convex)      │◄──►│                 │
│                 │    │                 │    │ • OpenAI GPT-5  │
│ • React 19      │    │ • Serverless    │    │ • Pinecone      │
│ • TypeScript    │    │ • Real-time     │    │ • Firecrawl     │
│ • Tailwind CSS  │    │ • Type-safe     │    │ • Resend        │
│ • i18n (4 lang) │    │ • Auto-scaling  │    │ • Clerk Auth    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **UI Library**: React 19 with Radix UI components
- **Styling**: Tailwind CSS 4 with custom design system
- **Authentication**: Clerk for user management and billing
- **Internationalization**: Custom i18n system (EN, IT, FR, ES - but scalable)
- **Code Quality**: TypeScript, ESLint, and comprehensive type safety

### Backend Stack

- **Runtime**: Convex serverless functions with automatic scaling
- **Database**: Convex real-time database with ACID transactions
- **Queue System**: Custom retry logic with exponential backoff
- **Cron Jobs**: Scheduled tasks for maintenance and processing

### Indexing Strategy

- **Performance Indexes**: User-based, status-based, and date-based queries
- **Composite Indexes**: Multi-field queries for complex operations
- **Unique Constraints**: Public sharing and namespace isolation

## 🔄 Data Flow & Processing Pipeline

### 1. Assistant Creation Flow

```
User Input → Validation → Queue Creation → Firecrawl Start →
Content Processing → Vector Embedding → Pinecone Storage → Assistant Ready
```

**Detailed Steps:**

1. **Input Validation**: URL format, domain accessibility, user limits
2. **Queue Management**: Priority assignment, retry logic, concurrent processing
3. **Web Crawling**: Firecrawl extraction with smart content cleaning
4. **Content Processing**: Text chunking, metadata extraction, deduplication
5. **Vector Generation**: OpenAI embeddings with optimal chunk size (1000 tokens)
6. **Storage**: Pinecone indexing with namespace isolation
7. **Status Updates**: Real-time progress via Convex subscriptions

### 2. Chat Interaction Flow

```
User Question → Usage Check → Vector Search →
Context Retrieval → AI Generation → Response + Sources
```

**RAG Implementation:**

- **Semantic Search**: Pinecone similarity search (top-k=5)
- **Context Assembly**: Relevant chunks with source attribution
- **AI Generation**: OpenAI GPT-5 with optimized prompts
- **Cost Optimization**: 85% cost reduction by avoiding conversation history
- **Source Citation**: Automatic linking to original documentation

### 3. Queue Processing System

```typescript
// Intelligent retry logic with exponential backoff
const retryDelays = [1, 5, 15, 30, 60]; // minutes
const maxRetries = 5;

// Priority system
const priorities = {
  pro: 1, // Highest priority
  free: 10, // Standard priority
  retry: 50, // Lower priority for retries
};
```

## 🔌 External Integrations

### OpenAI Integration

- **Model**: GPT-5 for high-quality responses
- **Embeddings**: text-embedding-3-small for vector generation
- **Optimization**: Streaming responses for better UX
- **Error Handling**: Rate limit management and fallback strategies

### Firecrawl Web Scraping

- **Smart Extraction**: Platform-specific content cleaning
- **Formats Supported**: Documentation sites, wikis, knowledge bases
- **Rate Limiting**: Respectful crawling with configurable delays
- **Error Recovery**: Robust handling of dynamic content and SPAs

### Pinecone Vector Database

- **Configuration**: 1536-dimensional vectors (OpenAI embedding size)
- **Namespacing**: User isolation for data security
- **Metadata**: URL, title, chunk info for source attribution
- **Scaling**: Automatic index management for performance

### Clerk Authentication & Billing

- **User Management**: Complete auth flow with social providers
- **Subscription Billing**: Integrated Stripe payments
- **Plan Management**: Free/Pro tier enforcement

### Resend Email Service

- **Welcome Emails**: Professional onboarding with HTML templates
- **Templates**: Responsive design for all devices

## 📋 Feature Comparison

### Free Plan

```
✅ 3 AI Assistants
✅ 20 Questions/month
✅ Basic crawling (30 pages max)
✅ 3 levels deep crawling
✅ All core features
```

### Pro Plan (Coming Soon)

```
🚀 20 AI Assistants
🚀 Unlimited Questions
🚀 Unlimited page crawling (limted for the hackathon up to 150)
🚀 Advanced crawling depth
🚀 Priority processing
```

## 🌍 Internationalization (i18n.js)

RefPaper supports 4 languages with complete feature parity:

- **English (EN)** - Primary language
- **Italian (IT)** - Complete translation
- **French (FR)** - Complete translation
- **Spanish (ES)** - Complete translation

## 🎨 UI/UX Design System

### Design Principles

- **Minimalist**: Clean, focused interface reducing cognitive load
- **Responsive**: Mobile-first design with desktop optimization
- **Accessible**: WCAG compliant with keyboard navigation
- **Fast**: Optimistic updates and skeleton loading states

### Main Component Architecture

```
components/
├── ui/                # Base components (Radix UI)
├── chat/              # Chat interface components
├── assistants/        # Assistant management
├── providers/         # Context providers
└── layout/            # Navigation and layout
└── ...                # generic + util components
```

## ⚡ Performance Optimizations

### Frontend Performance

- **Code Splitting**: Dynamic imports for non-critical components
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Tree shaking and minimal bundle size
- **Caching Strategy**: Aggressive caching for static assets

### Backend Performance

- **Database Optimization**: Efficient indexing and query patterns
- **Serverless Scaling**: Automatic scaling based on demand
- **Vector Search**: Optimized Pinecone queries with proper filtering
- **Caching**: Strategic caching for expensive operations

### AI Cost Optimization

```typescript
// Cost reduction strategies:
// 1. No conversation history (85% cost reduction)
// 2. Optimized prompts and context windows
// 3. Efficient embedding generation
// 4. Smart chunking for better relevance
```

## 🛠️ Development Workflow

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up environment variables
5. Start development: `npm run dev`

### Code Standards

- **TypeScript**: Strict mode with comprehensive typing
- **ESLint**: Enforced code quality and consistency
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Structured commit messages

## 🙏 Acknowledgments

- **OpenAI** for powerful language models
- **Pinecone** for vector database technology
- **Convex** for serverless backend infrastructure
- **Vercel** for seamless deployment platform
- **Clerk** for authentication and user management

---

**Built with ❤️ by [Cas](https://github.com/casiimir)**

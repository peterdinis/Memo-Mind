# 🧠 Memo-Mind

> **Transform your static documents into interactive conversations. Upload, analyze, and chat with your PDFs, DOCX, and TXT files using AI-powered intelligence.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-27272E?style=for-the-badge&logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

---

## ✨ Features

- 📁 **Multi-format Support**: Upload and process PDF, DOCX, and TXT files seamlessly.
- 💬 **Interactive AI Chat**: Ask questions and get instant answers based on your document's content.
- ⚡ **RAG Architecture**: Uses Retrieval-Augmented Generation for accurate, context-aware responses.
- 🔐 **Secure Auth**: Powered by Supabase Auth for safe user management.
- 🌓 **Dark Mode**: Beautifully crafted dark and light themes.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Vector Database**: [Pinecone](https://www.pinecone.io/)
- **AI Orchestration**: [LangChain](https://js.langchain.com/)
- **LLM**: OpenAI GPT-4o / GPT-3.5
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun or NPM
- Supabase Account
- Pinecone Account
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/memo-mind.git
   cd memo-mind
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file and add the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   OPENAI_API_KEY=your_openai_api_key
   
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=your_pinecone_index_name
   ```

4. **Run the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the magic happen!

---

## 📁 Project Structure

```text
├── actions/            # Server Actions (Processing, Auth, Chat)
├── app/               # Next.js App Router (Pages & Layouts)
├── components/        # UI Components (Dashboard, Shared, UI)
├── lib/               # Utility functions & shared config
├── schemas/           # Zod validation schemas
├── supabase/          # Supabase client & migration scripts
└── types/             # TypeScript type definitions
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by [Peter Dinis](https://github.com/peterdinis)
</p>

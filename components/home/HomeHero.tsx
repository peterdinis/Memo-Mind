"use client"

import { Sparkles, FileText, MessageSquare, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const HomeHero: React.FC = () => {
    const router = useRouter();
    return (
        <main className="flex-1 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Document Intelligence
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              Transform your documents into
              <span className="block mt-2 bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                intelligent conversations
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload any document and chat with an AI that understands your content. 
              Get instant insights, summaries, and answers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/auth")}
              className="bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-glow"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border/50 text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 space-y-3 hover:shadow-glow transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              <p className="text-sm text-muted-foreground">
                Support for PDF, Word, text files, and more. Your documents stay secure.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 space-y-3 hover:shadow-glow transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Chat with AI</h3>
              <p className="text-sm text-muted-foreground">
                Ask questions and get accurate answers based on your document content.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 space-y-3 hover:shadow-glow transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Instant Insights</h3>
              <p className="text-sm text-muted-foreground">
                Get summaries, key points, and deep analysis in seconds.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
}

export default HomeHero;
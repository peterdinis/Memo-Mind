"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Send, 
  Upload, 
  Download,
  Share,
  ArrowLeft,
  Bot,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";

// Mock data for the document
const mockDocument = {
  id: "1",
  title: "Project Requirements Document",
  type: "PDF",
  uploadedAt: "2024-01-15",
  size: "2.4 MB",
  status: "processed" as const,
  content: `# Project Requirements Document

## Executive Summary
This document outlines the requirements for the new enterprise management system.

## Functional Requirements
- User authentication and authorization
- Real-time data processing
- Reporting and analytics dashboard
- Integration with third-party APIs

## Technical Specifications
- **Backend**: Node.js with TypeScript
- **Frontend**: React with Next.js
- **Database**: PostgreSQL
- **Deployment**: Docker containers on AWS

## Timeline
- Phase 1: Q1 2024
- Phase 2: Q2 2024
- Phase 3: Q3 2024`
};

// Mock chat messages
const initialMessages = [
  {
    id: "1",
    role: "assistant" as const,
    content: "Hello! I'm ready to help you analyze this Project Requirements Document. What would you like to know about it?",
    timestamp: new Date(Date.now() - 3600000)
  }
];

export function DocumentChat() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: `I've analyzed your question about "${input}" in the document. Based on the requirements, here's what I found...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the main functional requirements?",
    "What technologies are being used?",
    "What is the project timeline?",
    "Summarize the executive summary"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Mechanical</h1>
                <p className="text-sm text-muted-foreground">A Document Chat</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Document Panel - Left Side */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {mockDocument.title}
                </CardTitle>
                <Badge variant="secondary" className="capitalize">
                  {mockDocument.type}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Size: {mockDocument.size}</span>
                <span>Uploaded: {mockDocument.uploadedAt}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {mockDocument.content}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Panel - Right Side */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-600" />
                Chat with AI
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ask questions about the document and get AI-powered insights.
              </p>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-green-100 text-green-600 dark:bg-green-900/20"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`flex-1 space-y-2 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`inline-block rounded-lg px-4 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="inline-block rounded-lg px-4 py-2 bg-muted">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Suggested Questions */}
              {messages.length <= 1 && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 px-3"
                        onClick={() => setInput(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about the document..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { FileText, Send, Download, ArrowLeft, Bot, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock document data
const mockDocument = {
    id: '1',
    title: 'Project Requirements Document',
    type: 'PDF',
    uploadedAt: '2024-01-15',
    size: '2.4 MB',
    status: 'processed' as const,
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
- Phase 3: Q3 2024`,
};

const initialMessages = [
    {
        id: '1',
        role: 'assistant' as const,
        content:
            "Hello! I'm ready to help you analyze this Project Requirements Document. What would you like to know about it?",
        timestamp: new Date(Date.now() - 3600000),
    },
];

export function DocumentChat() {
    const router = useRouter();
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        setTimeout(() => {
            const aiResponse = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: `I've analyzed your question about "${input}" in the document. Based on the requirements, here's what I found...`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // PDF Download Function
    const handleDownloadPDF = () => {
        // Create a new jsPDF instance
        const { jsPDF } = require('jspdf');
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text(mockDocument.title, 20, 20);

        // Add document metadata
        doc.setFontSize(12);
        doc.text(`Type: ${mockDocument.type}`, 20, 35);
        doc.text(`Size: ${mockDocument.size}`, 20, 42);
        doc.text(`Uploaded: ${mockDocument.uploadedAt}`, 20, 49);

        // Add content
        doc.setFontSize(14);
        const contentLines = doc.splitTextToSize(mockDocument.content, 170);
        doc.text(contentLines, 20, 65);

        // Add chat history if needed
        if (messages.length > 1) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text('Chat History', 20, 20);

            let yPosition = 35;
            messages.forEach((message, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(10);
                const role = message.role === 'user' ? 'User' : 'Assistant';
                const timestamp = message.timestamp.toLocaleString();
                doc.text(`${role} (${timestamp}):`, 20, yPosition);

                yPosition += 7;
                const messageLines = doc.splitTextToSize(message.content, 170);
                doc.text(messageLines, 20, yPosition);

                yPosition += messageLines.length * 7 + 10;
            });
        }

        // Save the PDF
        doc.save(`${mockDocument.title.replace(/\s+/g, '_')}.pdf`);
    };

    // Alternative: Download only document content as text file
    const handleDownloadTxt = () => {
        const element = document.createElement('a');
        const file = new Blob([mockDocument.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${mockDocument.title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const suggestedQuestions = [
        'What are the main functional requirements?',
        'What technologies are being used?',
        'What is the project timeline?',
        'Summarize the executive summary',
    ];

    return (
        <div className='bg-background flex min-h-screen flex-col'>
            {/* Header */}
            <header className='bg-card border-b'>
                <div className='container mx-auto flex items-center justify-between px-4 py-4'>
                    <div className='flex items-center gap-4'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => router.back()}
                            className='h-8 w-8'
                        >
                            <ArrowLeft className='h-4 w-4' />
                        </Button>
                        <div>
                            <h1 className='text-2xl font-bold'>Mechanical</h1>
                            <p className='text-muted-foreground text-sm'>
                                A Document Chat
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        {/* Download dropdown menu */}
                        <div className='group relative'>
                            <Button
                                variant='outline'
                                size='sm'
                                className='flex items-center gap-2'
                            >
                                <Download className='h-4 w-4' />
                                Download
                            </Button>
                            <div className='invisible absolute top-full right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800'>
                                <button
                                    onClick={handleDownloadPDF}
                                    className='w-full px-4 py-2 text-left text-sm first:rounded-t-md last:rounded-b-md hover:bg-gray-100 dark:hover:bg-gray-700'
                                >
                                    Download as PDF
                                </button>
                                <button
                                    onClick={handleDownloadTxt}
                                    className='w-full px-4 py-2 text-left text-sm first:rounded-t-md last:rounded-b-md hover:bg-gray-100 dark:hover:bg-gray-700'
                                >
                                    Download as Text
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className='container mx-auto grid flex-1 grid-cols-1 gap-6 overflow-hidden px-4 py-6 lg:grid-cols-2'>
                {/* Left Document Panel */}
                <Card className='flex flex-col overflow-hidden'>
                    <CardHeader className='pb-4'>
                        <div className='flex items-center justify-between'>
                            <CardTitle className='flex items-center gap-2'>
                                <FileText className='h-5 w-5 text-blue-600' />
                                {mockDocument.title}
                            </CardTitle>
                            <Badge variant='secondary' className='capitalize'>
                                {mockDocument.type}
                            </Badge>
                        </div>
                        <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                            <span>Size: {mockDocument.size}</span>
                            <span>Uploaded: {mockDocument.uploadedAt}</span>
                        </div>
                    </CardHeader>
                    <CardContent className='flex-1 overflow-hidden p-0'>
                        <ScrollArea className='h-full'>
                            <div className='p-6'>
                                <pre className='font-sans text-sm whitespace-pre-wrap'>
                                    {mockDocument.content}
                                </pre>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right Chat Panel */}
                <Card className='flex flex-col overflow-hidden'>
                    <CardHeader className='pb-4'>
                        <CardTitle className='flex items-center gap-2'>
                            <Bot className='h-5 w-5 text-green-600' />
                            Chat with AI
                        </CardTitle>
                        <p className='text-muted-foreground text-sm'>
                            Ask questions about the document and get AI-powered
                            insights.
                        </p>
                    </CardHeader>

                    <CardContent className='flex flex-1 flex-col overflow-hidden p-0'>
                        {/* Scrollable Chat Area */}
                        <div className='flex-1 overflow-y-auto px-6 py-4'>
                            <div className='space-y-6'>
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${
                                            message.role === 'user'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        }`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-green-100 text-green-600 dark:bg-green-900/20'
                                            }`}
                                        >
                                            {message.role === 'user' ? (
                                                <User className='h-4 w-4' />
                                            ) : (
                                                <Bot className='h-4 w-4' />
                                            )}
                                        </div>
                                        <div
                                            className={`flex-1 space-y-2 ${
                                                message.role === 'user'
                                                    ? 'text-right'
                                                    : 'text-left'
                                            }`}
                                        >
                                            <div
                                                className={`inline-block rounded-lg px-4 py-2 ${
                                                    message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                }`}
                                            >
                                                <p className='text-sm'>
                                                    {message.content}
                                                </p>
                                            </div>
                                            <p className='text-muted-foreground text-xs'>
                                                {message.timestamp.toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    },
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className='flex gap-3'>
                                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20'>
                                            <Bot className='h-4 w-4' />
                                        </div>
                                        <div className='flex-1 space-y-2'>
                                            <div className='bg-muted inline-block rounded-lg px-4 py-2'>
                                                <div className='flex space-x-1'>
                                                    <div className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full'></div>
                                                    <div
                                                        className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full'
                                                        style={{
                                                            animationDelay:
                                                                '0.1s',
                                                        }}
                                                    ></div>
                                                    <div
                                                        className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full'
                                                        style={{
                                                            animationDelay:
                                                                '0.2s',
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Scroll Anchor */}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Suggested Questions */}
                        {messages.length <= 1 && (
                            <div className='px-6 pb-4'>
                                <p className='text-muted-foreground mb-3 text-sm'>
                                    Try asking:
                                </p>
                                <div className='flex flex-wrap gap-2'>
                                    {suggestedQuestions.map(
                                        (question, index) => (
                                            <Button
                                                key={index}
                                                variant='outline'
                                                size='sm'
                                                className='h-auto px-3 py-2 text-xs'
                                                onClick={() =>
                                                    setInput(question)
                                                }
                                            >
                                                {question}
                                            </Button>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className='border-t p-4'>
                            <div className='flex gap-2'>
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder='Ask a question about the document...'
                                    className='flex-1'
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isLoading}
                                    size='icon'
                                >
                                    <Send className='h-4 w-4' />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

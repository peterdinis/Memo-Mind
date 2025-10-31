'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
    FileText,
    Send,
    ArrowLeft,
    Bot,
    User,
    Upload,
    X,
    File,
    Image,
    FileCode,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Empty,
    EmptyMedia,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
} from '@/components/ui/empty';

// Types
type DocumentType = 'PDF' | 'DOCX' | 'TXT' | 'IMAGE' | 'OTHER';
type DocumentStatus = 'uploading' | 'processing' | 'processed' | 'error';

interface Document {
    id: string;
    title: string;
    type: DocumentType;
    uploadedAt: string;
    size: string;
    status: DocumentStatus;
    content?: string;
    file?: File;
    url?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Mock documents data
const mockDocuments: Document[] = [
    {
        id: '1',
        title: 'Project Requirements Document',
        type: 'PDF',
        uploadedAt: '2024-01-15',
        size: '2.4 MB',
        status: 'processed',
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
    },
    {
        id: '2',
        title: 'Technical Architecture',
        type: 'PDF',
        uploadedAt: '2024-01-10',
        size: '1.8 MB',
        status: 'processed',
        content: `# Technical Architecture Document

## System Overview
Microservices-based architecture with event-driven communication.

## Components
- API Gateway
- User Service
- Payment Service
- Notification Service
- Analytics Service

## Infrastructure
- Kubernetes Cluster
- Redis Cache
- Message Queue (RabbitMQ)
- Monitoring Stack`,
    },
];

const initialMessages: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content:
            "Hello! I'm ready to help you analyze your documents. What would you like to know?",
        timestamp: new Date(Date.now() - 3600000),
    },
];

export function DocumentChat() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>(mockDocuments);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(
        mockDocuments[0],
    );
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getFileIcon = (type: DocumentType) => {
        switch (type) {
            case 'PDF':
                return <FileText className='h-4 w-4 text-red-600' />;
            case 'DOCX':
                return <FileText className='h-4 w-4 text-blue-600' />;
            case 'TXT':
                return <FileText className='h-4 w-4 text-gray-600' />;
            case 'IMAGE':
                return <Image className='h-4 w-4 text-green-600' />;
            default:
                return <FileCode className='h-4 w-4 text-orange-600' />;
        }
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        for (const file of Array.from(files)) {
            const fileType = getFileType(file.name);
            const newDoc: Document = {
                id: Date.now().toString(),
                title: file.name,
                type: fileType,
                uploadedAt: new Date().toISOString().split('T')[0],
                size: formatFileSize(file.size),
                status: 'processing',
                file: file,
            };

            setDocuments((prev) => [newDoc, ...prev]);

            // Simulate processing
            setTimeout(() => {
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === newDoc.id
                            ? { ...doc, status: 'processed' }
                            : doc,
                    ),
                );
                if (!selectedDocument) {
                    setSelectedDocument({ ...newDoc, status: 'processed' });
                }
            }, 2000);
        }

        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getFileType = (fileName: string): DocumentType => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'PDF';
        if (['doc', 'docx'].includes(ext!)) return 'DOCX';
        if (ext === 'txt') return 'TXT';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext!))
            return 'IMAGE';
        return 'OTHER';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedDocument) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I've analyzed your question about "${input}" in the document "${selectedDocument.title}". Based on the content, here's what I found...`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDeleteDocument = (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        if (selectedDocument?.id === docId) {
            setSelectedDocument(
                documents.find((doc) => doc.id !== docId) || null,
            );
        }
    };

    const renderDocumentContent = (doc: Document) => {
        if (doc.status === 'uploading' || doc.status === 'processing') {
            return (
                <div className='flex h-32 items-center justify-center'>
                    <div className='text-center'>
                        <div className='bg-primary/20 mx-auto mb-2 h-8 w-8 animate-spin rounded-full'></div>
                        <p className='text-muted-foreground text-sm'>
                            {doc.status === 'uploading'
                                ? 'Uploading...'
                                : 'Processing...'}
                        </p>
                    </div>
                </div>
            );
        }

        if (doc.type === 'IMAGE' && doc.file) {
            return (
                <div className='flex justify-center p-4'>
                    <img
                        src={URL.createObjectURL(doc.file)}
                        alt={doc.title}
                        className='max-h-96 rounded-lg object-contain'
                    />
                </div>
            );
        }

        if (doc.type === 'PDF') {
            return (
                <div className='h-full'>
                    <div className='border-b p-4'>
                        <h3 className='font-semibold'>PDF Preview</h3>
                        <p className='text-muted-foreground text-sm'>
                            This is a simulated PDF preview. In a real
                            application, you would integrate with a PDF viewer
                            library.
                        </p>
                    </div>
                    <ScrollArea className='h-[500px]'>
                        <div className='p-6'>
                            <div className='bg-muted rounded-lg p-8'>
                                <div className='mx-auto max-w-4xl'>
                                    <div className='bg-background border shadow-lg'>
                                        {/* Simulated PDF pages */}
                                        <div className='border-b p-8'>
                                            <h1 className='mb-4 text-2xl font-bold'>
                                                {doc.title}
                                            </h1>
                                            <div className='text-muted-foreground space-y-2 text-sm'>
                                                <p>Type: {doc.type}</p>
                                                <p>Size: {doc.size}</p>
                                                <p>
                                                    Uploaded: {doc.uploadedAt}
                                                </p>
                                            </div>
                                        </div>
                                        <div className='p-8'>
                                            <pre className='font-sans text-sm whitespace-pre-wrap'>
                                                {doc.content ||
                                                    'Document content will appear here...'}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            );
        }

        return (
            <ScrollArea className='h-full'>
                <div className='p-6'>
                    <pre className='font-sans text-sm whitespace-pre-wrap'>
                        {doc.content || 'Document content will appear here...'}
                    </pre>
                </div>
            </ScrollArea>
        );
    };

    const suggestedQuestions = [
        'What are the main points of this document?',
        'Summarize the key requirements',
        'What technologies are mentioned?',
        'Explain the timeline and phases',
    ];

    if (documents.length === 0) {
        return (
            <div className='bg-background flex min-h-screen flex-col'>
                <main className='container mx-auto flex flex-1 items-center justify-center px-4 py-6'>
                    <div className='w-full max-w-3xl text-center'>
                        <Empty className='border-0 bg-transparent p-16'>
                            <EmptyMedia variant='icon' size='lg'>
                                <FileText className='text-muted-foreground/70 h-12 w-12' />
                            </EmptyMedia>

                            <EmptyHeader className='mb-8'>
                                <EmptyTitle className='mb-4 text-3xl font-bold'>
                                    No documents to analyze
                                </EmptyTitle>
                                <EmptyDescription className='text-xl leading-8'>
                                    Your document library is currently empty.
                                    <br />
                                    Upload documents to start AI-powered
                                    analysis and discussion.
                                </EmptyDescription>
                            </EmptyHeader>

                            <EmptyContent className='mx-auto max-w-md'>
                                <input
                                    type='file'
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    multiple
                                    accept='.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp'
                                    className='hidden'
                                />
                            </EmptyContent>
                        </Empty>
                    </div>
                </main>
            </div>
        );
    }

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
                            <h1 className='text-2xl font-bold'>
                                Document Chat
                            </h1>
                            <p className='text-muted-foreground text-sm'>
                                AI-powered document analysis and discussion
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <input
                            type='file'
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            multiple
                            accept='.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp'
                            className='hidden'
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant='outline'
                            size='sm'
                            className='flex items-center gap-2'
                            disabled={uploading}
                        >
                            <Upload className='h-4 w-4' />
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className='container mx-auto grid flex-1 grid-cols-1 gap-6 overflow-hidden px-4 py-6 lg:grid-cols-3'>
                {/* Left Sidebar - Document List */}
                <Card className='lg:col-span-1'>
                    <CardHeader>
                        <CardTitle>Documents</CardTitle>
                        <p className='text-muted-foreground text-sm'>
                            {documents.length} document(s) loaded
                        </p>
                    </CardHeader>
                    <CardContent className='p-0'>
                        <ScrollArea className='h-[600px]'>
                            <div className='space-y-2 p-4'>
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className={`hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-all ${
                                            selectedDocument?.id === doc.id
                                                ? 'border-primary bg-muted'
                                                : 'border-transparent'
                                        }`}
                                        onClick={() => setSelectedDocument(doc)}
                                    >
                                        <div className='flex items-start justify-between'>
                                            <div className='flex items-center gap-2'>
                                                {getFileIcon(doc.type)}
                                                <div className='min-w-0 flex-1'>
                                                    <p className='truncate text-sm font-medium'>
                                                        {doc.title}
                                                    </p>
                                                    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                                                        <span>{doc.type}</span>
                                                        <span>•</span>
                                                        <span>{doc.size}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {doc.uploadedAt}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6'
                                                onClick={(e) =>
                                                    handleDeleteDocument(
                                                        doc.id,
                                                        e,
                                                    )
                                                }
                                            >
                                                <X className='h-3 w-3' />
                                            </Button>
                                        </div>
                                        <div className='mt-2 flex items-center justify-between'>
                                            <Badge
                                                variant={
                                                    doc.status === 'processed'
                                                        ? 'default'
                                                        : doc.status ===
                                                            'processing'
                                                          ? 'secondary'
                                                          : 'outline'
                                                }
                                                className='text-xs capitalize'
                                            >
                                                {doc.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Middle - Document Viewer */}
                <Card className='flex flex-col overflow-hidden lg:col-span-1'>
                    <CardHeader className='pb-4'>
                        <div className='flex items-center justify-between'>
                            <CardTitle className='flex items-center gap-2'>
                                {selectedDocument &&
                                    getFileIcon(selectedDocument.type)}
                                {selectedDocument?.title ||
                                    'No document selected'}
                            </CardTitle>
                            {selectedDocument && (
                                <Badge
                                    variant='secondary'
                                    className='capitalize'
                                >
                                    {selectedDocument.type}
                                </Badge>
                            )}
                        </div>
                        {selectedDocument && (
                            <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                                <span>Size: {selectedDocument.size}</span>
                                <span>
                                    Uploaded: {selectedDocument.uploadedAt}
                                </span>
                                <span>Status: {selectedDocument.status}</span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className='flex-1 overflow-hidden p-0'>
                        {selectedDocument ? (
                            renderDocumentContent(selectedDocument)
                        ) : (
                            <div className='flex h-full items-center justify-center'>
                                <Empty>
                                    <EmptyMedia>
                                        <File className='text-muted-foreground h-8 w-8' />
                                    </EmptyMedia>
                                    <EmptyHeader>
                                        <EmptyTitle>
                                            No document selected
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            Select a document from the list to
                                            view its content
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right - Chat Panel */}
                <Card className='flex flex-col overflow-hidden lg:col-span-1'>
                    <CardHeader className='pb-4'>
                        <CardTitle className='flex items-center gap-2'>
                            <Bot className='h-5 w-5 text-green-600' />
                            AI Assistant
                        </CardTitle>
                        <p className='text-muted-foreground text-sm'>
                            {selectedDocument
                                ? `Ask questions about "${selectedDocument.title}"`
                                : 'Select a document to start chatting'}
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

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Suggested Questions */}
                        {selectedDocument && messages.length <= 1 && (
                            <div className='px-6 pb-4'>
                                <p className='text-muted-foreground mb-3 text-sm'>
                                    Try asking about this document:
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
                                    placeholder={
                                        selectedDocument
                                            ? `Ask about ${selectedDocument.title}...`
                                            : 'Select a document to start chatting...'
                                    }
                                    className='flex-1'
                                    disabled={!selectedDocument || isLoading}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={
                                        !input.trim() ||
                                        !selectedDocument ||
                                        isLoading
                                    }
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

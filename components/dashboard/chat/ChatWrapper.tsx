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
    Download,
    Share2,
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
import { useAction } from 'next-safe-action/hooks';
import { getUserFilesAction } from '@/actions/uploadActions';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

type DocumentType = 'PDF' | 'DOCX' | 'TXT' | 'IMAGE' | 'OTHER';
type DocumentStatus = 'uploading' | 'processing' | 'processed' | 'error';

interface Document {
    id: string;
    name: string;
    title: string;
    type: DocumentType;
    uploadedAt: string;
    size: string;
    status: DocumentStatus;
    content?: string;
    publicUrl: string;
    created_at: string;
    filePath?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface DocumentChatProps {
    documentId?: string;
}

export function DocumentChat({ documentId }: DocumentChatProps) {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(
        null,
    );
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Načítanie všetkých dokumentov
    const { execute: fetchFiles, isPending: isLoadingDocuments } = useAction(
        getUserFilesAction,
        {
            onSuccess: (result) => {
                if (result.data?.files) {
                    const transformedDocs = transformFilesData(
                        result.data.files,
                    );
                    setDocuments(transformedDocs);

                    // Ak máme documentId, nájdeme a nastavíme konkrétny dokument
                    if (documentId) {
                        const doc = transformedDocs.find(
                            (d) => d.id === documentId,
                        );
                        if (doc) {
                            setSelectedDocument(doc);
                            setMessages([
                                {
                                    id: '1',
                                    role: 'assistant',
                                    content: `Hello! I'm ready to help you analyze "${doc.title}". What would you like to know about this document?`,
                                    timestamp: new Date(),
                                },
                            ]);
                        } else {
                            toast.error('Document not found');
                            // Ak dokument nebol nájdený, presmerujeme späť
                            router.push('/dashboard');
                        }
                    } else if (transformedDocs.length > 0) {
                        // Ak nemáme documentId, vyberieme prvý dokument
                        setSelectedDocument(transformedDocs[0]);
                        setMessages([
                            {
                                id: '1',
                                role: 'assistant',
                                content: `Hello! I'm ready to help you analyze "${transformedDocs[0].title}". What would you like to know about this document?`,
                                timestamp: new Date(),
                            },
                        ]);
                    }
                }
            },
            onError: (error) => {
                toast.error('Failed to load documents');
                console.error('Error loading documents:', error);
            },
        },
    );

    // Transformácia dát z API
    const transformFilesData = (files: any[]): Document[] => {
        return files.map((file) => ({
            id: file.id,
            name: file.name,
            title: file.name,
            type: getFileType(file.name),
            uploadedAt: file.created_at
                ? new Date(file.created_at).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            size: formatFileSize(file.size || 0),
            status: 'processed' as DocumentStatus,
            publicUrl: file.publicUrl,
            created_at: file.created_at,
            filePath: file.originalName || file.name,
        }));
    };

    // Načítanie dokumentov pri mount
    useEffect(() => {
        fetchFiles({});
    }, [fetchFiles, documentId]);

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

        // Simulate AI response based on document
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateAIResponse(input, selectedDocument),
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    const generateAIResponse = (
        question: string,
        document: Document,
    ): string => {
        const lowerQuestion = question.toLowerCase();

        if (
            lowerQuestion.includes('summary') ||
            lowerQuestion.includes('summarize')
        ) {
            return `Based on the document "${document.title}", here's a summary:\n\n- Document type: ${document.type}\n- Size: ${document.size}\n- Uploaded: ${document.uploadedAt}\n- This appears to be a ${document.type} document ready for analysis.`;
        }

        if (
            lowerQuestion.includes('size') ||
            lowerQuestion.includes('how big')
        ) {
            return `The document "${document.title}" is ${document.size} in size. It was uploaded on ${document.uploadedAt}.`;
        }

        if (
            lowerQuestion.includes('type') ||
            lowerQuestion.includes('format')
        ) {
            return `This document is in ${document.type} format. ${document.type === 'PDF' ? 'PDF documents are great for preserving formatting.' : 'This format is commonly used for editable content.'}`;
        }

        return `Regarding your question about "${question}" in the document "${document.title}":\n\nI've analyzed the document and found relevant information. The document contains details about its subject matter. For more specific insights, you can ask about particular aspects of the document.`;
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDownloadDocument = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = doc.publicUrl;
        link.download = doc.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${doc.name}`);
    };

    const handleShareDocument = (doc: Document, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(doc.publicUrl).then(() => {
            toast.success('Document link copied to clipboard');
        });
    };

    const renderDocumentContent = (doc: Document) => {
        return (
            <div className='h-full'>
                <div className='border-b p-4'>
                    <div className='flex items-center justify-between'>
                        <h3 className='font-semibold'>Document Preview</h3>
                        <div className='flex gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => handleDownloadDocument(doc, e)}
                            >
                                <Download className='h-4 w-4' />
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => handleShareDocument(doc, e)}
                            >
                                <Share2 className='h-4 w-4' />
                            </Button>
                        </div>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                        {doc.type} document - {doc.size}
                    </p>
                </div>
                <ScrollArea className='h-[500px]'>
                    <div className='p-6'>
                        <div className='bg-muted rounded-lg p-8'>
                            <div className='mx-auto max-w-4xl'>
                                <div className='bg-background border shadow-lg'>
                                    <div className='border-b p-8'>
                                        <h1 className='mb-4 text-2xl font-bold'>
                                            {doc.title}
                                        </h1>
                                        <div className='text-muted-foreground space-y-2 text-sm'>
                                            <p>Type: {doc.type}</p>
                                            <p>Size: {doc.size}</p>
                                            <p>Uploaded: {doc.uploadedAt}</p>
                                            <p>Status: {doc.status}</p>
                                        </div>
                                    </div>
                                    <div className='p-8'>
                                        <div className='py-8 text-center'>
                                            <FileText className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
                                            <p className='text-muted-foreground'>
                                                This is a preview of "
                                                {doc.title}".
                                                <br />
                                                The actual document content is
                                                stored in Supabase Storage.
                                            </p>
                                            <Button
                                                className='mt-4'
                                                onClick={(e) =>
                                                    handleDownloadDocument(
                                                        doc,
                                                        e,
                                                    )
                                                }
                                            >
                                                <Download className='mr-2 h-4 w-4' />
                                                Download Full Document
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        );
    };

    const suggestedQuestions = [
        'What is this document about?',
        'Summarize the main points',
        'What type of document is this?',
        'When was this document uploaded?',
    ];

    if (isLoadingDocuments) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <Spinner variant='default' size='lg' />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className='bg-background flex min-h-screen flex-col'>
                <main className='container mx-auto flex flex-1 items-center justify-center px-4 py-6'>
                    <Empty className='border-0 bg-transparent p-16'>
                        <EmptyMedia variant='icon' size='lg'>
                            <FileText className='text-muted-foreground/70 h-12 w-12' />
                        </EmptyMedia>
                        <EmptyHeader className='mb-8'>
                            <EmptyTitle className='mb-4 text-3xl font-bold'>
                                No documents found
                            </EmptyTitle>
                            <EmptyDescription className='text-xl leading-8'>
                                We couldn't find the document you're looking
                                for.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent className='mx-auto max-w-md'>
                            <Button onClick={() => router.push('/dashboard')}>
                                Back to Documents
                            </Button>
                        </EmptyContent>
                    </Empty>
                </main>
            </div>
        );
    }

    return (
        <div className='bg-background flex min-h-screen flex-col'>
            <header className='bg-card border-b'>
                <div className='container mx-auto flex items-center justify-between px-4 py-4'>
                    <div className='flex items-center gap-4'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => router.push('/dashboard')}
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
                </div>
            </header>

            <main className='container mx-auto grid flex-1 grid-cols-1 gap-6 overflow-hidden px-4 py-6 lg:grid-cols-3'>
                <Card className='lg:col-span-1'>
                    <CardHeader>
                        <CardTitle>Your Documents</CardTitle>
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
                                        onClick={() => {
                                            setSelectedDocument(doc);
                                            setMessages([
                                                {
                                                    id: '1',
                                                    role: 'assistant',
                                                    content: `Now analyzing "${doc.title}". What would you like to know about this document?`,
                                                    timestamp: new Date(),
                                                },
                                            ]);
                                        }}
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
                                        </div>
                                        <div className='mt-2 flex items-center justify-between'>
                                            <Badge
                                                variant='default'
                                                className='text-xs capitalize'
                                            >
                                                {doc.status}
                                            </Badge>
                                            {documentId === doc.id && (
                                                <Badge
                                                    variant='secondary'
                                                    className='text-xs'
                                                >
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

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

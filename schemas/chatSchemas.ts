import z from "zod";

export const chatWithDocumentSchema = z.object({
    documentId: z.string(),
    message: z.string().min(1, 'Message is required'),
    chatHistory: z
        .array(
            z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string(),
            }),
        )
        .optional()
        .default([]),
});

export const processDocumentSchema = z.object({
    documentId: z.string(),
});
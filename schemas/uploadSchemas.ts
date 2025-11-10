import { z } from 'zod';

export const uploadFileSchema = z.object({
    files: z.array(z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
        data: z.string(),
    })),
    folder: z.string().default('documents'),
});

export const userFilesSchema = z.object({});

export const deleteFileSchema = z.object({
    filePath: z.string(),
});
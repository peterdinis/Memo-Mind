'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import {
    deleteFileSchema,
    uploadFileSchema,
    userFilesSchema,
} from '@/schemas/uploadSchemas';
import { createClient } from '@/supabase/server';

export const uploadFileAction = authenticatedAction
    .inputSchema(uploadFileSchema)
    .action(async ({ parsedInput: { files, folder } }) => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;
        const uploadResults: {
            fileName: string;
            success: boolean;
            publicUrl?: string;
            filePath?: string;
            size?: number;
            type?: string;
            documentId?: string;
            error?: string;
        }[] = [];

        for (const file of files) {
            try {
                const base64Data = file.data.split(',')[1];
                const byteCharacters = Buffer.from(base64Data, 'base64');

                const timestamp = Date.now();
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${userId}/${folder}/${timestamp}_${safeFileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, byteCharacters, {
                        contentType: file.type,
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(
                        `Failed to upload ${file.name}: ${uploadError.message}`,
                    );
                }

                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                const { data: docRecord, error: docError } = await supabase
                    .from('processed_documents')
                    .insert({
                        user_id: userId,
                        name: safeFileName,
                        status: 'processed',
                        chunks_count: 0,
                        metadata: {
                            originalFileName: file.name,
                            size: file.size,
                            type: file.type,
                        },
                    })
                    .select()
                    .maybeSingle();

                if (docError || !docRecord) {
                    throw new Error(
                        `Failed to register document in database: ${docError?.message}`,
                    );
                }

                uploadResults.push({
                    fileName: file.name,
                    success: true,
                    publicUrl: urlData.publicUrl,
                    filePath,
                    size: file.size,
                    type: file.type,
                    documentId: docRecord.id,
                });
            } catch (error) {
                uploadResults.push({
                    fileName: file.name,
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                });
            }
        }

        const failedUploads = uploadResults.filter((r) => !r.success);
        if (failedUploads.length > 0) {
            throw new Error(
                `Failed to upload ${failedUploads.length} file(s): ${failedUploads
                    .map((f) => f.fileName)
                    .join(', ')}`,
            );
        }

        return {
            success: true,
            message: `Successfully uploaded ${uploadResults.length} file(s)`,
            results: uploadResults,
        };
    });

export const getUserFilesAction = authenticatedAction
    .inputSchema(userFilesSchema)
    .action(async () => {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;

        const { data: docs, error: docsError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (docsError) {
            throw new Error(`Failed to fetch documents: ${docsError.message}`);
        }

        const { data: storageFiles, error: storageError } =
            await supabase.storage
                .from('documents')
                .list(`${userId}/documents`, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

        if (storageError) {
            console.warn(
                'Warning: failed to list storage files',
                storageError.message,
            );
        }

        const filesWithUrls = (docs || []).map((doc) => {
            const storageFile = storageFiles?.find((f) =>
                f.name.includes(doc.name),
            );
            return {
                id: doc.id,
                name: doc.name,
                title: doc.name,
                filePath: storageFile
                    ? `${userId}/documents/${storageFile.name}`
                    : undefined,
                publicUrl: storageFile
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${userId}/documents/${storageFile.name}`
                    : undefined,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                status: doc.status,
                chunks_count: doc.chunks_count,
                size: doc.metadata?.size || 0,
                type: doc.metadata?.type || 'UNKNOWN',
            };
        });

        return { files: filesWithUrls };
    });

export const deleteFileAction = authenticatedAction
    .inputSchema(deleteFileSchema)
    .action(async ({ parsedInput: { filePath } }) => {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('User not authenticated');

        const userId = user.id;
        if (!filePath.startsWith(`${userId}/`))
            throw new Error('Access denied');

        const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePath]);

        if (storageError)
            throw new Error(
                `Failed to delete file from storage: ${storageError.message}`,
            );

        const { error: docError } = await supabase
            .from('processed_documents')
            .delete()
            .eq('user_id', userId)
            .eq('name', filePath.split('/').pop());

        if (docError) {
            console.warn(
                'Warning: failed to delete document record',
                docError.message,
            );
        }

        return { success: true, message: 'File deleted successfully' };
    });

export const getFileDetailsAction = authenticatedAction
    .inputSchema(deleteFileSchema)
    .action(async ({ parsedInput: { filePath } }) => {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('User not authenticated');

        const userId = user.id;
        if (!filePath.startsWith(`${userId}/`))
            throw new Error('Access denied');

        const { data: fileDetails } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return {
            publicUrl: fileDetails.publicUrl,
            filePath,
        };
    });

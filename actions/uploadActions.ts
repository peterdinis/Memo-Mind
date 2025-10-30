'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import { deleteFileSchema, uploadFileSchema, userFilesSchema } from '@/schemas/uploadSchemas';
import { createClient } from '@/supabase/server';

export const uploadFileAction = authenticatedAction
    .inputSchema(uploadFileSchema)
    .action(async ({ parsedInput: { files, folder } }) => {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;
        const uploadResults: { fileName: string; success: boolean; publicUrl?: string; filePath?: string; size?: number; type?: string; error?: string; }[] = [];

        for (const file of files) {
            try {
                const base64Data = file.data.split(',')[1];
                const byteCharacters = Buffer.from(base64Data, 'base64');

                const timestamp = Date.now();
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileName = `${userId}/${folder}/${timestamp}_${safeFileName}`;

                const { error } = await supabase.storage
                    .from('documents')
                    .upload(fileName, byteCharacters, {
                        contentType: file.type,
                        upsert: false,
                    });

                if (error) {
                    throw new Error(`Failed to upload ${file.name}: ${error.message}`);
                }

                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                uploadResults.push({
                    fileName: file.name,
                    success: true,
                    publicUrl: urlData.publicUrl,
                    filePath: fileName,
                    size: file.size,
                    type: file.type,
                });

            } catch (error) {
                uploadResults.push({
                    fileName: file.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        const failedUploads = uploadResults.filter(result => !result.success);

        if (failedUploads.length > 0) {
            throw new Error(
                `Failed to upload ${failedUploads.length} file(s): ${failedUploads.map(f => f.fileName).join(', ')}`
            );
        }

        return {
            success: true,
            message: `Successfully uploaded ${uploadResults.length} file(s)`,
            results: uploadResults
        };
    });

export const getUserFilesAction = authenticatedAction
    .inputSchema(userFilesSchema)
    .action(async () => {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;
        const { data: files, error } = await supabase.storage
            .from('documents')
            .list(`${userId}/documents`, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            if (error.message.includes('not found')) {
                return { files: [] };
            }
            throw new Error(`Failed to fetch files: ${error.message}`);
        }

        const filesWithUrls = (files || []).map(file => ({
            id: file.id,
            name: file.name.replace(/^\d+_/, ''),
            originalName: file.name,
            created_at: file.created_at,
            updated_at: file.updated_at,
            last_accessed_at: file.last_accessed_at,
            metadata: file.metadata,
            size: file.metadata?.size || 0,
            publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${userId}/documents/${file.name}`
        }));

        return { files: filesWithUrls };
    });

export const deleteFileAction = authenticatedAction
    .inputSchema(deleteFileSchema)
    .action(async ({ parsedInput: { filePath } }) => {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;

        if (!filePath.startsWith(`${userId}/`)) {
            throw new Error('Access denied');
        }

        const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePath]);

        if (storageError) {
            throw new Error(`Failed to delete file from storage: ${storageError.message}`);
        }

        return { success: true, message: 'File deleted successfully' };
    });

export const getFileDetailsAction = authenticatedAction
    .inputSchema(deleteFileSchema)
    .action(async ({ parsedInput: { filePath } }) => {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;

        if (!filePath.startsWith(`${userId}/`)) {
            throw new Error('Access denied');
        }

        const { data: fileDetails } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return {
            publicUrl: fileDetails.publicUrl,
            filePath: filePath
        };
    });
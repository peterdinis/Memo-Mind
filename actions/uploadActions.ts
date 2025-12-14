'use server';

import { authenticatedAction } from '@/lib/next-safe-action';
import {
    deleteFileSchema,
    uploadFileSchema,
    userFilesSchema,
} from '@/schemas/uploadSchemas';
import { createClient } from '@/supabase/server';
import { processDocumentAction } from '@/actions/processDocumentActions';

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

        // Validate file types and sizes
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB

        for (const file of files) {
            try {
                // Validate file type
                if (!allowedTypes.includes(file.type)) {
                    throw new Error(
                        `File type ${file.type} is not supported. Please upload PDF, TXT, or DOCX files.`,
                    );
                }

                // Validate file size
                if (file.size > maxSize) {
                    throw new Error(
                        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB.`,
                    );
                }

                const base64Data = file.data.split(',')[1];
                const byteCharacters = Buffer.from(base64Data, 'base64');

                const timestamp = Date.now();
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${userId}/${folder}/${timestamp}_${safeFileName}`;

                // Upload file to storage
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

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                // Create document record - FIXED: Use proper document ID
                const { data: docRecord, error: docError } = await supabase
                    .from('processed_documents')
                    .insert({
                        user_id: userId,
                        name: safeFileName,
                        original_name: file.name,
                        status: 'uploading',
                        chunks_count: 0,
                        metadata: {
                            originalFileName: file.name,
                            size: file.size,
                            type: file.type,
                            filePath: filePath,
                            uploadedAt: new Date().toISOString(),
                        },
                    })
                    .select()
                    .single();

                if (docError || !docRecord) {
                    // Clean up storage if DB insert fails
                    await supabase.storage.from('documents').remove([filePath]);
                    throw new Error(
                        `Failed to register document in database: ${docError?.message}`,
                    );
                }

                // Trigger background processing - FIXED: Use proper function
                await processDocumentInBackground({
                    documentId: docRecord.id, // Use the actual document ID from database
                    filePath: filePath,
                    fileName: file.name,
                });

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
                console.error(`Upload failed for ${file.name}:`, error);
                uploadResults.push({
                    fileName: file.name,
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error occurred during upload',
                });
            }
        }

        const failedUploads = uploadResults.filter((r) => !r.success);
        if (failedUploads.length > 0) {
            const errorMessage =
                failedUploads.length === uploadResults.length
                    ? `Failed to upload all ${failedUploads.length} file(s)`
                    : `Failed to upload ${failedUploads.length} of ${uploadResults.length} file(s)`;

            throw new Error(
                `${errorMessage}: ${failedUploads
                    .map((f) => `${f.fileName} (${f.error})`)
                    .join(', ')}`,
            );
        }

        return {
            success: true,
            message: `Successfully uploaded ${uploadResults.length} file(s). Processing started...`,
            results: uploadResults,
        };
    });

// Background processing function - FIXED
async function processDocumentInBackground(params: {
    documentId: string;
    filePath: string;
    fileName: string;
}) {
    try {
        // Directly call the action without dynamic import
        await processDocumentAction({
            documentId: params.documentId,
            filePath: params.filePath,
            fileName: params.fileName,
        });
    } catch (error) {
        console.error('Background processing error:', error);
        const supabase = await createClient();

        // Update document status to error
        await supabase
            .from('processed_documents')
            .update({
                status: 'error',
                metadata: {
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown processing error',
                    processedAt: new Date().toISOString(),
                },
            })
            .eq('id', params.documentId);
    }
}

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

        // Get documents from database
        const { data: docs, error: docsError } = await supabase
            .from('processed_documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (docsError) {
            throw new Error(`Failed to fetch documents: ${docsError.message}`);
        }

        // Get files from storage for URL generation
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

        // Combine database records with storage URLs
        const filesWithUrls = (docs || []).map((doc) => {
            // Find matching storage file
            const storageFile = storageFiles?.find(
                (f) =>
                    f.name.includes(doc.name) ||
                    doc.metadata?.filePath?.includes(f.name),
            );

            // Generate public URL
            let publicUrl: string | undefined = undefined;
            if (storageFile) {
                publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${userId}/documents/${storageFile.name}`;
            } else if (doc.metadata?.filePath) {
                // Fallback: generate URL from filePath in metadata
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(doc.metadata.filePath);
                publicUrl = urlData.publicUrl;
            }

            return {
                id: doc.id,
                name: doc.name,
                originalName: doc.original_name || doc.name,
                title: doc.original_name || doc.name,
                filePath:
                    doc.metadata?.filePath ||
                    (storageFile
                        ? `${userId}/documents/${storageFile.name}`
                        : undefined),
                publicUrl: publicUrl,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                status: doc.status || 'unknown',
                chunks_count: doc.chunks_count || 0,
                size: doc.metadata?.size || 0,
                type: getFileTypeFromMime(doc.metadata?.type) || 'UNKNOWN',
                metadata: doc.metadata,
            };
        });

        return { files: filesWithUrls };
    });

export const deleteFileAction = authenticatedAction
    .inputSchema(deleteFileSchema)
    .action(async ({ parsedInput: { filePath, documentId } }) => {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const userId = user.id;

        try {
            // If filePath is provided, delete from storage
            if (filePath) {
                if (!filePath.startsWith(`${userId}/`)) {
                    throw new Error('Access denied - invalid file path');
                }

                const { error: storageError } = await supabase.storage
                    .from('documents')
                    .remove([filePath]);

                if (storageError) {
                    console.warn(
                        'Failed to delete file from storage:',
                        storageError.message,
                    );
                    // Continue with database deletion even if storage deletion fails
                }
            }

            // If documentId is provided, delete from database
            if (documentId) {
                const { error: docError } = await supabase
                    .from('processed_documents')
                    .delete()
                    .eq('id', documentId)
                    .eq('user_id', userId);

                if (docError) {
                    throw new Error(
                        `Failed to delete document record: ${docError.message}`,
                    );
                }
            }

            // If only filePath is provided, try to find and delete the corresponding document
            if (filePath && !documentId) {
                const fileName = filePath.split('/').pop();
                const { error: docError } = await supabase
                    .from('processed_documents')
                    .delete()
                    .eq('user_id', userId)
                    .eq('name', fileName);

                if (docError) {
                    console.warn(
                        'Failed to delete document record by file name:',
                        docError.message,
                    );
                }
            }

            return {
                success: true,
                message: 'File deleted successfully',
            };
        } catch (error) {
            console.error('Delete file error:', error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete file',
            );
        }
    });

export const getFileDetailsAction = authenticatedAction
    .inputSchema(deleteFileSchema)
    .action(async ({ parsedInput: { filePath } }) => {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

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
            filePath,
        };
    });

// Helper function to get file type from MIME type
function getFileTypeFromMime(mimeType: string | undefined): string {
    if (!mimeType) return 'UNKNOWN';

    const typeMap: { [key: string]: string } = {
        'application/pdf': 'PDF',
        'text/plain': 'TXT',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            'DOCX',
        'application/msword': 'DOC',
        'image/jpeg': 'IMAGE',
        'image/jpg': 'IMAGE',
        'image/png': 'IMAGE',
        'image/gif': 'IMAGE',
        'image/webp': 'IMAGE',
    };

    return typeMap[mimeType] || 'UNKNOWN';
}

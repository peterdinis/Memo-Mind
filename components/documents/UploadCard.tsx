'use client';

import { FC, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from '@tanstack/react-form';
import { Plus, FileText, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useAction } from 'next-safe-action/hooks';
import { uploadFileAction } from '@/actions/uploadActions';
import { toast } from 'sonner';

interface UploadedFile {
    file: File;
    preview?: string;
    id: string;
}

const UploadCard: FC = () => {
    const { execute: uploadFiles, isPending: isUploading } = useAction(uploadFileAction, {
        onSuccess: (data) => {
            toast.success(data.data?.message || 'Files uploaded successfully');
            form.reset();
        },
        onError: (error) => {
            toast.error('Failed to upload files');
        },
    });

    const form = useForm({
        defaultValues: {
            files: [] as UploadedFile[],
        },
        onSubmit: async ({ value }) => {
            if (value.files.length === 0) return;

            const toastId = toast.loading('Uploading files...');

            // Convert files to base64 for server action
            const filesWithData = await Promise.all(
                value.files.map(async (uploadedFile) => {
                    const base64 = await fileToBase64(uploadedFile.file);
                    return {
                        name: uploadedFile.file.name,
                        type: uploadedFile.file.type,
                        size: uploadedFile.file.size,
                        data: base64,
                    };
                })
            );

            // Execute upload action
            uploadFiles({ 
                files: filesWithData,
                folder: 'documents'
            });

            // Toast sa zavrie automaticky cez onSuccess/onError
        },
    });

    // Helper function to convert File to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: file.type.startsWith('image/')
                    ? URL.createObjectURL(file)
                    : undefined,
            }));

            const currentFiles = form.getFieldValue('files');
            form.setFieldValue('files', [...currentFiles, ...newFiles]);

            if (newFiles.length > 0) {
                toast.success(`Added ${newFiles.length} file(s) to upload list`);
            }
        },
        [form],
    );

    const removeFile = (fileId: string) => {
        const currentFiles = form.getFieldValue('files');
        const fileToRemove = currentFiles.find((f: UploadedFile) => f.id === fileId);
        
        // Clean up object URLs
        if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }

        const updatedFiles = currentFiles.filter(
            (f: UploadedFile) => f.id !== fileId,
        );
        form.setFieldValue('files', updatedFiles);

        toast.info('File removed from upload list');
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                ['.docx'],
            'text/plain': ['.txt'],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const uploadedFiles = form.getFieldValue('files');

    return (
        <div className='space-y-4'>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className='space-y-4'
            >
                <Card
                    {...getRootProps()}
                    className={`border-2 border-dashed ${
                        isDragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                    } group flex h-full min-h-[280px] cursor-pointer flex-col transition-all duration-200 hover:shadow-md`}
                >
                    <CardContent className='flex flex-1 flex-col items-center justify-center p-6'>
                        <input {...getInputProps()} />
                        <div className='bg-primary/10 group-hover:bg-primary/20 mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-200 group-hover:scale-110'>
                            <Plus className='text-primary h-8 w-8' />
                        </div>
                        <p className='mb-2 text-center text-lg font-semibold'>
                            {isDragActive
                                ? 'Drop files here...'
                                : 'Upload New Document'}
                        </p>
                        <p className='text-muted-foreground text-center text-sm'>
                            PDF, DOCX, TXT files supported (max 10MB)
                        </p>
                        {isDragActive && (
                            <p className='text-primary mt-2 text-sm font-medium'>
                                Release to upload
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Zoznam nahratých súborov */}
                {uploadedFiles.length > 0 && (
                    <div className='space-y-2'>
                        <h3 className='text-sm font-semibold'>
                            Selected files:
                        </h3>
                        <div className='space-y-2'>
                            {uploadedFiles.map((uploadedFile: UploadedFile) => (
                                <div
                                    key={uploadedFile.id}
                                    className='bg-muted/50 flex items-center justify-between rounded-lg border p-3'
                                >
                                    <div className='flex items-center space-x-3'>
                                        <FileText className='text-muted-foreground h-5 w-5' />
                                        <div>
                                            <p className='text-sm font-medium'>
                                                {uploadedFile.file.name}
                                            </p>
                                            <p className='text-muted-foreground text-xs'>
                                                {(
                                                    uploadedFile.file.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{' '}
                                                MB
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={() =>
                                            removeFile(uploadedFile.id)
                                        }
                                        className='hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0'
                                        disabled={isUploading}
                                    >
                                        <X className='h-4 w-4' />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Submit button */}
                        <div className='flex justify-end pt-2'>
                            <Button
                                type='submit'
                                disabled={uploadedFiles.length === 0 || isUploading}
                            >
                                {isUploading ? (
                                    <>Uploading...</>
                                ) : (
                                    <>
                                        Upload {uploadedFiles.length} file
                                        {uploadedFiles.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default UploadCard;
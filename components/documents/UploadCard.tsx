"use client"

import { FC, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "@tanstack/react-form";
import { Plus, FileText, X } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

const UploadCard: FC = () => {
  const form = useForm({
    defaultValues: {
      files: [] as UploadedFile[],
    },
    onSubmit: async ({ value }) => {
      console.log("Uploading files:", value.files);
      // Tu môžete spracovať upload súborov
      // Napríklad odoslať na server
      
      // Reset formulára po úspešnom odoslaní
      form.reset();
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    const currentFiles = form.getFieldValue('files');
    form.setFieldValue('files', [...currentFiles, ...newFiles]);
  }, [form]);

  const removeFile = (fileId: string) => {
    const currentFiles = form.getFieldValue('files');
    const updatedFiles = currentFiles.filter((f: UploadedFile) => f.id !== fileId);
    form.setFieldValue('files', updatedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const uploadedFiles = form.getFieldValue('files');

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <Card 
          {...getRootProps()}
          className={`border-2 border-dashed ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          } transition-all duration-200 cursor-pointer hover:shadow-md group h-full min-h-[280px] flex flex-col`}
        >
          <CardContent className="flex flex-col items-center justify-center flex-1 p-6">
            <input {...getInputProps()} />
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-200">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold text-lg text-center mb-2">
              {isDragActive ? 'Drop files here...' : 'Upload New Document'}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              PDF, DOCX, TXT files supported (max 10MB)
            </p>
            {isDragActive && (
              <p className="text-sm text-primary mt-2 font-medium">
                Release to upload
              </p>
            )}
          </CardContent>
        </Card>

        {/* Zoznam nahratých súborov */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Selected files:</h3>
            <div className="space-y-2">
              {uploadedFiles.map((uploadedFile: UploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-2">
              <Button 
                type="submit"
                disabled={uploadedFiles.length === 0}
              >
                Upload {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadCard;
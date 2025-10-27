"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  MoreVertical, 
  MessageSquare, 
  Calendar,
  Download,
  Trash2,
  Share,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";

// Mock data
const mockDocuments = [
  {
    id: "1",
    title: "Project Requirements Document",
    type: "PDF",
    uploadedAt: "2024-01-15",
    size: "2.4 MB",
    status: "processed" as const,
  },
  {
    id: "2",
    title: "Research Paper Analysis",
    type: "DOCX",
    uploadedAt: "2024-01-14",
    size: "1.8 MB",
    status: "processing" as const,
  },
  {
    id: "3",
    title: "Meeting Notes Q1",
    type: "TXT",
    uploadedAt: "2024-01-13",
    size: "0.8 MB",
    status: "processed" as const,
  },
  {
    id: "4",
    title: "Technical Documentation",
    type: "PDF",
    uploadedAt: "2024-01-12",
    size: "3.2 MB",
    status: "processed" as const,
  },
];

const statusVariants = {
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  processed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export function DocumentGrid() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Upload New Card */}
      <Card 
        className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-200 cursor-pointer hover:shadow-md group"
        onClick={() => router.push("/dashboard/upload")}
      >
        <CardContent className="flex flex-col items-center justify-center h-40 p-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium text-center">Upload New Document</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            PDF, DOCX, TXT
          </p>
        </CardContent>
      </Card>

      {/* Document Cards */}
      {mockDocuments.map((doc) => (
        <Card 
          key={doc.id}
          className="group hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/10"
          onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-lg font-semibold line-clamp-2 mt-2">
              {doc.title}
            </CardTitle>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="secondary" className="text-xs">
                {doc.type}
              </Badge>
              <Badge 
                className={`text-xs ${statusVariants[doc.status]}`}
                variant="outline"
              >
                {doc.status === "processing" ? "Processing..." : "Ready"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium">{doc.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{doc.uploadedAt}</span>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4 gap-2"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/chat/${doc.id}`);
              }}
              disabled={doc.status === "processing"}
            >
              <MessageSquare className="h-4 w-4" />
              Chat with AI
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
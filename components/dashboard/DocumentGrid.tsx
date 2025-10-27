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
  {
    id: "5",
    title: "Business Plan 2024",
    type: "PDF",
    uploadedAt: "2024-01-11",
    size: "4.1 MB",
    status: "processed" as const,
  },
  {
    id: "6",
    title: "User Research Findings",
    type: "DOCX",
    uploadedAt: "2024-01-10",
    size: "2.7 MB",
    status: "processed" as const,
  },
  {
    id: "7",
    title: "API Documentation",
    type: "PDF",
    uploadedAt: "2024-01-09",
    size: "5.3 MB",
    status: "processed" as const,
  },
  {
    id: "8",
    title: "Product Specifications",
    type: "DOCX",
    uploadedAt: "2024-01-08",
    size: "3.8 MB",
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
    <div className="min-h-screen">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Documents</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">24</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Ready to Chat</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">22</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Processing</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">2</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Storage Used</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">45.2 MB</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Project Requirements.pdf</p>
                  <p className="text-sm text-muted-foreground">Upload completed</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Chat session started</p>
                  <p className="text-sm text-muted-foreground">With Research Paper Analysis</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">5 hours ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Research Paper Analysis.docx</p>
                  <p className="text-sm text-muted-foreground">Processing started</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Documents</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Sort by: Newest
            </Button>
            <Button variant="outline" size="sm">
              Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Upload New Card */}
          <Card 
            className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-200 cursor-pointer hover:shadow-md group h-full min-h-[280px] flex flex-col"
            onClick={() => router.push("/dashboard/upload")}
          >
            <CardContent className="flex flex-col items-center justify-center flex-1 p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-200">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg text-center mb-2">Upload New Document</p>
              <p className="text-sm text-muted-foreground text-center">
                PDF, DOCX, TXT files supported
              </p>
            </CardContent>
          </Card>

          {/* Document Cards */}
          {mockDocuments.map((doc) => (
            <Card 
              key={doc.id}
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/20 h-full min-h-[280px] flex flex-col"
              onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
            >
              <CardHeader className="pb-3 flex-1">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                <CardTitle className="text-lg font-semibold line-clamp-3 mt-4 leading-tight">
                  {doc.title}
                </CardTitle>
                <div className="flex items-center justify-between mt-4">
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
                <div className="space-y-3 text-sm mb-4">
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
                  className="w-full gap-2"
                  variant="default"
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
      </div>
    </div>
  );
}
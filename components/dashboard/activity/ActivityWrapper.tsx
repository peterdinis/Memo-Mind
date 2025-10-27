import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, MessageSquare } from "lucide-react"

const ActivityWrapper: React.FC = () => {
    return (
        <>
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
        </>
    )
}

export default ActivityWrapper
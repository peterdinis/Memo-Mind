import fs from 'fs/promises';
import { Document } from '@langchain/core/documents';

// Manual TextLoader implementation since it's missing in @langchain/community
export class TextLoader {
    constructor(public filePath: string) {}
    async load(): Promise<Document[]> {
        const text = await fs.readFile(this.filePath, 'utf-8');
        return [
            new Document({
                pageContent: text,
                metadata: { source: this.filePath },
            }),
        ];
    }
}

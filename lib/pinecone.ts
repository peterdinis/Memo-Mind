import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pineconeClient) {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
    }
    return pineconeClient;
};

export const PINECONE_INDEX_NAME = 'documents';
export const PINECONE_NAMESPACE = 'document-chunks';

export async function createPineconeIndex() {
    const client = await getPineconeClient();

    try {
        const indexList = await client.listIndexes();
        const indexExists = indexList.indexes?.some(
            (index) => index.name === PINECONE_INDEX_NAME
        );

        if (!indexExists) {
            await client.createIndex({
                name: PINECONE_INDEX_NAME,
                dimension: 1536,
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });

            await new Promise(resolve => setTimeout(resolve, 60000));
        } else {
            console.log(`Pinecone index ${PINECONE_INDEX_NAME} already exists`);
        }
    } catch (error) {
        console.error('Error creating Pinecone index:', error);
        throw error;
    }
}
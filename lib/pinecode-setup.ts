import { Pinecone } from '@pinecone-database/pinecone';

async function setupPinecone() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'documents';

    if (!apiKey) {
        console.error(
            '❌ PINECONE_API_KEY is not set in environment variables',
        );
        process.exit(1);
    }

    const pinecone = new Pinecone({ apiKey });

    try {
        const indexes = await pinecone.listIndexes();
        const indexNames = indexes.indexes?.map((index) => index.name) || [];

        if (indexNames.includes(indexName)) {
            await pinecone.describeIndex(indexName);

            return;
        }

        await pinecone.createIndex({
            name: indexName,
            dimension: 1536, // pre text-embedding-ada-002
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1',
                },
            },
        });

        let isReady = false;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 10s = 5 minút max

        while (!isReady && attempts < maxAttempts) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 sekúnd

            try {
                const description = await pinecone.describeIndex(indexName);
                const status = description.status?.state;

                if (status === 'Ready') {
                    isReady = true;
                    break;
                }
            } catch (error) {
                throw error;
            }
        }

        if (!isReady) {
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error setting up Pinecone:', error);
        process.exit(1);
    }
}

setupPinecone();

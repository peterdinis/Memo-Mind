// scripts/setup-pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';

async function setupPinecone() {
    const apiKey =
        'pcsk_3b9iX1_UvkZGAK6FnFHBihkcfu99NDXdod1Q1HCrEiHQkWfCyHVVzVWpQu8oxKALp1E7MB';
    const indexName = process.env.PINECONE_INDEX_NAME || 'documents';

    if (!apiKey) {
        console.error(
            '❌ PINECONE_API_KEY is not set in environment variables',
        );
        process.exit(1);
    }

    console.log('🔑 Pinecone API Key found');
    console.log('📋 Target index name:', indexName);

    const pinecone = new Pinecone({ apiKey });

    try {
        // Získanie zoznamu existujúcich indexov
        console.log('📊 Checking existing indexes...');
        const indexes = await pinecone.listIndexes();
        const indexNames = indexes.indexes?.map((index) => index.name) || [];

        console.log(
            '✅ Available indexes:',
            indexNames.length > 0 ? indexNames : 'None',
        );

        if (indexNames.includes(indexName)) {
            console.log(`✅ Index "${indexName}" already exists`);

            // Skontrolovať stav indexu
            const indexDescription = await pinecone.describeIndex(indexName);
            console.log(`📈 Index status: ${indexDescription.status?.state}`);
            console.log(`📏 Index dimension: ${indexDescription.dimension}`);

            return;
        }

        // Vytvorenie nového indexu
        console.log(`🚀 Creating new index: "${indexName}"...`);

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

        console.log(`✅ Index "${indexName}" creation initiated`);
        console.log(
            '⏳ Waiting for index to be ready... (this may take 1-2 minutes)',
        );

        // Čakáme kým bude index ready s progress indicatorom
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 10s = 5 minút max

        while (!isReady && attempts < maxAttempts) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 sekúnd

            try {
                const description = await pinecone.describeIndex(indexName);
                const status = description.status?.state;

                console.log(
                    `⏰ Attempt ${attempts}/${maxAttempts}: Index status - ${status}`,
                );

                if (status === 'Ready') {
                    isReady = true;
                    console.log('🎉 Index is ready!');
                    break;
                }
            } catch (error) {
                console.log(
                    `⏰ Attempt ${attempts}/${maxAttempts}: Still initializing...`,
                );
            }
        }

        if (!isReady) {
            console.log(
                '❌ Index creation timeout. Please check Pinecone console.',
            );
            process.exit(1);
        }

        console.log('✅ Pinecone setup completed successfully!');
    } catch (error) {
        console.error('❌ Error setting up Pinecone:', error);
        process.exit(1);
    }
}

// Spustenie setupu
setupPinecone();

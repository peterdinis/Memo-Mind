// @/lib/pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';

export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'documents';
export const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || 'default';

let pineconeClient: Pinecone | null = null;

export const getPineconeClient = async (): Promise<Pinecone> => {
  if (pineconeClient) {
    return pineconeClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;
  const environment = "development"

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY is not set');
  }

  if (!environment) {
    throw new Error('PINECONE_ENVIRONMENT is not set');
  }

  try {
    pineconeClient = new Pinecone({
      apiKey,
      // environment sa už nepoužíva v novšej verzii Pinecone
    });

    // Overenie, že index existuje
    const indexes = await pineconeClient.listIndexes();
    const indexNames = indexes.indexes?.map(index => index.name) || [];
    
    if (!indexNames.includes(PINECONE_INDEX_NAME)) {
      throw new Error(`Pinecone index "${PINECONE_INDEX_NAME}" not found. Available indexes: ${indexNames.join(', ')}`);
    }

    return pineconeClient;
  } catch (error) {
    console.error('Pinecone initialization error:', error);
    throw new Error(`Failed to initialize Pinecone: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Pomocná funkcia pre vytvorenie indexu ak neexistuje
export const ensurePineconeIndex = async (): Promise<void> => {
  try {
    const pinecone = await getPineconeClient();
    const indexes = await pinecone.listIndexes();
    const indexNames = indexes.indexes?.map(index => index.name) || [];

    if (!indexNames.includes(PINECONE_INDEX_NAME)) {
      console.log(`Creating Pinecone index: ${PINECONE_INDEX_NAME}`);
      
      await pinecone.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: 1536, // pre text-embedding-ada-002
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });

      // Počkajte kým bude index ready
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 sekúnd
    }
  } catch (error) {
    console.error('Error ensuring Pinecone index:', error);
    throw error;
  }
};
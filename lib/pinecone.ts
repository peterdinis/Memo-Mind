// @/lib/pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';

export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'documents';
export const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || 'default';

let pineconeClient: Pinecone | null = null;
let indexCreationInProgress = false;

export const getPineconeClient = async (): Promise<Pinecone> => {
  if (pineconeClient) {
    return pineconeClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY is not set in environment variables');
  }

  try {
    pineconeClient = new Pinecone({ apiKey });
    
    // Skontrolujeme či index existuje
    const indexes = await pineconeClient.listIndexes();
    const indexNames = indexes.indexes?.map(index => index.name) || [];
    
    if (!indexNames.includes(PINECONE_INDEX_NAME)) {
      console.log(`📋 Pinecone index "${PINECONE_INDEX_NAME}" not found. Creating...`);
      await createPineconeIndex(pineconeClient);
    }

    return pineconeClient;
  } catch (error) {
    console.error('Pinecone initialization error:', error);
    throw new Error(`Failed to initialize Pinecone: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

async function createPineconeIndex(pinecone: Pinecone): Promise<void> {
  // Zabráňte viacnásobnému vytvoreniu indexu
  if (indexCreationInProgress) {
    console.log('⏳ Index creation already in progress, waiting...');
    // Počkajte maximálne 2 minúty
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const indexes = await pinecone.listIndexes();
      const indexNames = indexes.indexes?.map(index => index.name) || [];
      if (indexNames.includes(PINECONE_INDEX_NAME)) {
        console.log('✅ Index is now ready!');
        return;
      }
    }
    throw new Error('Index creation timeout');
  }

  indexCreationInProgress = true;

  try {
    console.log(`🚀 Creating Pinecone index: ${PINECONE_INDEX_NAME}`);
    
    await pinecone.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension: 1536,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });

    console.log('⏳ Waiting for index to be ready...');
    
    // Čakáme kým bude index ready
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minút
    
    while (!isReady && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const description = await pinecone.describeIndex(PINECONE_INDEX_NAME);
        const status = description.status?.state;
        
        console.log(`⏰ Attempt ${attempts}/${maxAttempts}: ${status}`);
        
        if (status === 'Ready') {
          isReady = true;
          console.log('✅ Pinecone index is ready!');
          break;
        }
      } catch (error) {
        console.log(`⏰ Attempt ${attempts}/${maxAttempts}: Still initializing...`);
      }
    }

    if (!isReady) {
      throw new Error('Index creation timeout - check Pinecone console');
    }

  } finally {
    indexCreationInProgress = false;
  }
}

// Pomocná funkcia pre získanie indexu
export const getPineconeIndex = async () => {
  const pinecone = await getPineconeClient();
  return pinecone.index(PINECONE_INDEX_NAME);
};
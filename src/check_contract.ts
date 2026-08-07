import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

async function main() {
  const provider = indexerPublicDataProvider(
    'https://indexer.preprod.midnight.network/api/v4/graphql',
    'wss://indexer.preprod.midnight.network/api/v4/graphql/ws'
  );
  const addr = 'e90f198f85c9e1981f7171271b746dc09941c972a3a111d4dc82440c219d83fd';
  console.log('Querying state for:', addr);
  try {
    const state = await provider.queryContractState(addr);
    console.log('On-chain state:', state);
  } catch (err) {
    console.error('Error querying contract state:', err);
  }
}

main().catch(console.error);

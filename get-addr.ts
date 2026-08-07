import { resolveNetwork, getOrCreateSeed } from './src/network.ts';
import { createWallet } from './src/wallet.ts';
import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket;

async function printAddress() {
  const { network, config: networkConfig } = resolveNetwork();
  const seed = getOrCreateSeed(network);
  const walletCtx = await createWallet({ network, networkConfig, seed });
  const address = walletCtx.unshieldedKeystore.getBech32Address();
  console.log('Address:', address.toString());
  process.exit(0);
}
printAddress();

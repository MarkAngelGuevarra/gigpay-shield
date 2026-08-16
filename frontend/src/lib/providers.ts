import { ZKConfigProvider } from '@midnight-ntwrk/midnight-js-types';
import { type ProverKey, type VerifierKey, type ZKIR } from '@midnight-ntwrk/midnight-js-types';
import { type WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type CoinPublicKey, type EncPublicKey, type FinalizedTransaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';

export class BrowserZKConfigProvider extends ZKConfigProvider<string> {
  private baseUrl: string;
  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
  }
  
  async getZKIR(circuitId: string): Promise<ZKIR> {
    const res = await fetch(`${this.baseUrl}/zkir/${circuitId}.zkir`);
    if (!res.ok) throw new Error(`Failed to fetch ZKIR for ${circuitId}`);
    return new Uint8Array(await res.arrayBuffer()) as unknown as ZKIR;
  }

  async getProverKey(circuitId: string): Promise<ProverKey> {
    const res = await fetch(`${this.baseUrl}/keys/${circuitId}.pk`);
    if (!res.ok) throw new Error(`Failed to fetch prover key for ${circuitId}`);
    return new Uint8Array(await res.arrayBuffer()) as unknown as ProverKey;
  }

  async getVerifierKey(circuitId: string): Promise<VerifierKey> {
    const res = await fetch(`${this.baseUrl}/keys/${circuitId}.vk`);
    if (!res.ok) throw new Error(`Failed to fetch verifier key for ${circuitId}`);
    return new Uint8Array(await res.arrayBuffer()) as unknown as VerifierKey;
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export const buildProviders = async (api: WalletConnectedAPI): Promise<MidnightProviders> => {
  const config = await api.getConfiguration();
  

  // Fake a wallet provider that delegates balancing to Lace.
  const walletProvider = {
    getCoinPublicKey: (): CoinPublicKey => {
      throw new Error("getCoinPublicKey not synchronously available via DApp connector");
    },
    getEncryptionPublicKey: (): EncPublicKey => {
      throw new Error("getEncryptionPublicKey not synchronously available via DApp connector");
    },
    balanceTx: async (tx: any, _ttl?: Date): Promise<FinalizedTransaction> => {
       const txBytes = bytesToHex(new Uint8Array(tx));
       const { tx: balancedTxHex } = await api.balanceUnsealedTransaction(txBytes);
       return hexToBytes(balancedTxHex) as any;
    },
    submitTx: async (tx: any) => {
       await api.submitTransaction(bytesToHex(new Uint8Array(tx)));
    }
  };

  const zkConfigProvider = new BrowserZKConfigProvider('/gigpay');

  // Apply Blockfrost override if VITE_BLOCKFROST_PROJECT_ID is provided
  const blockfrostProjectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
  const indexerUri = blockfrostProjectId 
    ? `https://midnight-preprod.blockfrost.network/api/v1?project_id=${blockfrostProjectId}`
    : config.indexerUri;
  const indexerWsUri = blockfrostProjectId
    ? `wss://midnight-preprod.blockfrost.network/ws/api/v1?project_id=${blockfrostProjectId}`
    : config.indexerWsUri;

  const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri, window.WebSocket as any);
  // Optional: you can use api.getProvingProvider(zkConfigProvider.asKeyMaterialProvider()) if you want to use Lace's proving server!
  // Let's use the local one for now:
  const proofProvider = httpClientProofProvider(config.proverServerUri || "https://proof-server.preprod.midnight.network", zkConfigProvider);

  return {
    privateStateProvider: {
      setContractAddress: () => {},
      get: async () => null,
      set: async () => {},
      clear: async () => {},
    } as any,
    zkConfigProvider,
    publicDataProvider,
    walletProvider: walletProvider as any,
    proofProvider,
    midnightProvider: walletProvider as any,
  };
};

import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { Contract } from "../frontend/src/managed/gigpay/contract/index.js";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { resolveNetwork, getOrCreateSeed, getDeployment } from "../src/network.js";
import { createWallet, persistWalletState } from "../src/wallet.js";
import { WebSocket } from "ws";

globalThis.WebSocket = WebSocket;

async function run() {
  const { network, config: networkConfig } = resolveNetwork();
  const SEED = getOrCreateSeed(network);
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  await walletCtx.wallet.waitForSyncedState();

  const zkConfigProvider = new NodeZkConfigProvider("../contracts/managed/gigpay");
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx, _ctx) { return tx; },
    async submitTx(tx) { return tx; },
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: "gigpay-state",
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
      privateStoragePasswordProvider: () => "Local-Devnet-Development-Placeholder-1",
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  const compiledContract = CompiledContract.make("gigpay", Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets("../contracts/managed/gigpay")
  );

  const deployment = getDeployment(network);
  const deployed = await findDeployedContract(providers, {
    contractAddress: deployment.address,
    compiledContract: compiledContract as any,
    privateStateId: "gigpayPrivateState",
    initialPrivateState: {},
  });

  const projectName = "My Shielded Gig".padEnd(31, " ").slice(0, 31);
  const amount = 100n;
  const shieldedCoinPublicKey = "some31bytestring123456789012345";
  const freelancerPubKey = "another31bytestring123456789012";

  console.log("Calling circuit...");
  try {
    await deployed.callTx.createShieldedGig(projectName, amount, shieldedCoinPublicKey, freelancerPubKey);
    console.log("Circuit success!");
  } catch (e: any) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}
run();

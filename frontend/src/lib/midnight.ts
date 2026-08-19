import { type InitialAPI, type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

declare global {
  interface Window {
    midnight?: {
      [key: string]: InitialAPI;
    };
  }
}

let connectedAPI: ConnectedAPI | null = null;
let connectionPromise: Promise<ConnectedAPI> | null = null;

/**
 * Resolves the Lace Midnight wallet InitialAPI instance from window.midnight.
 * Explicitly targets 'mnLace' while maintaining fallback compatibility with any standard injected provider.
 */
export const getLaceInitialAPI = (): InitialAPI | null => {
  if (typeof window === 'undefined' || !window.midnight) {
    return null;
  }

  // 1. Explicitly check for canonical Midnight Lace injection key 'mnLace'
  if (window.midnight.mnLace && typeof window.midnight.mnLace.connect === 'function') {
    return window.midnight.mnLace;
  }

  // 2. Fallback: Check for any provider with 'lace' in its key, name, or RDNS
  const entries = Object.entries(window.midnight);
  const laceEntry = entries.find(([key, provider]) => {
    const keyLower = key.toLowerCase();
    const nameLower = provider?.name?.toLowerCase() || '';
    const rdnsLower = provider?.rdns?.toLowerCase() || '';
    return (
      (keyLower.includes('lace') || nameLower.includes('lace') || rdnsLower.includes('lace') ||
       keyLower.includes('1am') || nameLower.includes('1am') || rdnsLower.includes('1am')) &&
      typeof provider?.connect === 'function'
    );
  });

  if (laceEntry) {
    return laceEntry[1];
  }

  // 3. Fallback: First available valid InitialAPI
  const firstValid = Object.values(window.midnight).find(
    (p) => p && typeof p.connect === 'function'
  );

  return firstValid || null;
};

/**
 * Discovers the provider (alias for getLaceInitialAPI).
 */
export const getLaceProvider = getLaceInitialAPI;

/**
 * Asynchronous injection readiness helper to gracefully handle browser extension load timings.
 * Polls for window.midnight and Lace InitialAPI availability up to timeoutMs.
 */
export const waitForLace = async (
  timeoutMs = 3000,
  intervalMs = 100
): Promise<InitialAPI> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const api = getLaceInitialAPI();
    if (api) {
      return api;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    'No compatible Midnight wallet (Lace or 1AM) detected. Please ensure your wallet extension is installed, enabled, and the page has been refreshed.'
  );
};

/**
 * Categorizes and formats errors from the Lace DApp connector into actionable user guidance.
 */
export const formatWalletError = (err: any, networkId = 'preview'): string => {
  const msg = (err?.message || String(err)).trim();
  const msgLower = msg.toLowerCase();

  if (msgLower.includes('locked')) {
    return `Wallet reports locked or dormant for network "${networkId}". Please open your wallet extension, verify the network selector is set to "${
      networkId === 'preview' ? 'Midnight Preview' : networkId
    }", unlock with your password, and click Connect again.`;
  }

  if (
    msgLower.includes('rejected') ||
    msgLower.includes('permission') ||
    msgLower.includes('denied') ||
    msgLower.includes('cancelled') ||
    msgLower.includes('user reject')
  ) {
    return 'Connection request was rejected or cancelled. Please authorize the connection in your wallet extension to proceed.';
  }

  if (
    msgLower.includes('not detected') ||
    msgLower.includes('not installed') ||
    msgLower.includes('not available')
  ) {
    return 'No compatible Midnight wallet was found. Please install a wallet (like Lace or 1AM) and refresh the page.';
  }

  if (msgLower.includes('network') || msgLower.includes('mismatch')) {
    return `Network mismatch detected. Please switch your wallet network to "${
      networkId === 'preview' ? 'Midnight Preview' : networkId
    }" and reconnect.`;
  }

  return `Failed to connect: ${msg}`;
};

/**
 * Connects to the Lace Midnight wallet with:
 * - Asynchronous injection readiness polling (waitForLace)
 * - In-flight connection mutex to prevent concurrent request collisions
 * - Global network ID synchronization (setNetworkId)
 * - Structured error handling with retry for transient MV3 service worker latency
 */
export const connectLace = async (networkId = 'preview'): Promise<ConnectedAPI> => {
  // Connection mutex: Return active in-flight connection promise if one is already running
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const laceAPI = await waitForLace(3000);

      let api: ConnectedAPI | null = null;
      let lastErr: any = null;
      const MAX_ATTEMPTS = 2;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          api = await laceAPI.connect(networkId);
          break;
        } catch (err: any) {
          lastErr = err;
          const msg = (err?.message || String(err)).toLowerCase();

          // If locked, timeout, or internal error on first attempt, briefly wait for MV3 service worker to rehydrate
          if (
            (msg.includes('locked') ||
              msg.includes('internalerror') ||
              msg.includes('timeout') ||
              msg.includes('message port') ||
              msg.includes('context invalidated')) &&
            attempt < MAX_ATTEMPTS
          ) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw err;
        }
      }

      if (!api) {
        throw lastErr || new Error('Failed to establish connection with wallet.');
      }

      // Query wallet configuration to confirm active network
      try {
        const config = await api.getConfiguration();
        const activeNetwork = config.networkId || networkId;
        setNetworkId(activeNetwork);
      } catch {
        // Fallback: set explicitly requested network ID
        setNetworkId(networkId);
      }

      connectedAPI = api;
      return api;
    } catch (err: any) {
      const formattedMessage = formatWalletError(err, networkId);
      const errorWithGuidance = new Error(formattedMessage);
      (errorWithGuidance as any).originalError = err;
      throw errorWithGuidance;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

/**
 * Returns the currently active ConnectedAPI instance, if connected.
 */
export const getConnectedAPI = (): ConnectedAPI | null => {
  return connectedAPI;
};

/**
 * Disconnects the Lace session and resets the cached ConnectedAPI instance.
 */
export const disconnectLace = (): void => {
  connectedAPI = null;
  connectionPromise = null;
};


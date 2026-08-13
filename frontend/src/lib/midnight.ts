import { type InitialAPI, type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

declare global {
  interface Window {
    midnight?: {
      [key: string]: InitialAPI;
    };
  }
}

let connectedAPI: ConnectedAPI | null = null;

export const connectLace = async (networkId = 'undeployed'): Promise<ConnectedAPI> => {
  const providers = window.midnight || {};
  const laceAPI = Object.values(providers)[0];
  
  if (!laceAPI) {
    throw new Error('Lace or 1AM wallet is not installed or not available on the window object.');
  }

  // Request connection
  const api = await laceAPI.connect(networkId);
  connectedAPI = api;
  return api;
};

export const getConnectedAPI = () => {
  return connectedAPI;
};

export const disconnectLace = () => {
  connectedAPI = null;
};

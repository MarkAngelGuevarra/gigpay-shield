import { useState, useEffect } from 'react';
import { connectLace, getConnectedAPI, disconnectLace } from './lib/midnight';
import { buildProviders } from './lib/providers';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract } from './managed/gigpay/contract/index';
import './index.css';

function App() {
  const [address, setAddress] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('02d2fc4309c6eb1b427b3b0d238dc830c2c31e9c20a1ebf7c00e16c9ef5a0f2b');
  const [projectName, setProjectName] = useState('My Shielded Gig');
  const [amount, setAmount] = useState('100');
  const [freelancerPubKey, setFreelancerPubKey] = useState('mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s');
  const [status, setStatus] = useState<string>('');
  const [txId, setTxId] = useState<string>('');

  // Auto-connect to Lace if already authorized
  useEffect(() => {
    const attemptAutoConnect = async () => {
      // Small delay to ensure the window.midnight object is injected by the extension
      setTimeout(async () => {
        if (window.midnight) {
          try {
            await handleConnect(true);
          } catch (e) {
            // Silently fail auto-connect so the user can click the button manually
          }
        }
      }, 500);
    };
    attemptAutoConnect();
  }, []);

  const handleConnect = async (isAutoConnect: boolean | any = false) => {
    try {
      if (isAutoConnect !== true) setStatus('Connecting to Lace...');
      // Try preprod first (matches deployed contract), fall back to preview
      let api;
      try {
        api = await connectLace('preprod');
      } catch {
        api = await connectLace('preview');
      }
      const addrs = await api.getUnshieldedAddress();
      setAddress(addrs.unshieldedAddress);
      setStatus('Connected!');
    } catch (err: any) {
      console.error(err);
      setStatus(`Failed to connect: ${err.message}`);
    }
  };

  const handleDisconnect = () => {
    disconnectLace();
    setAddress('');
    setStatus('Wallet disconnected.');
    setTxId('');
  };

  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus('Preparing circuit...');
      setTxId('');
      
      const api = getConnectedAPI();
      if (!api) throw new Error("Wallet not connected");

      const providers = await buildProviders(api);

      const compiledContract = CompiledContract.make('gigpay', Contract).pipe(
        CompiledContract.withVacantWitnesses,
        // In browser, ZKConfigProvider handles fetching keys, so we don't need withCompiledFileAssets
      );

      setStatus('Finding deployed contract...');
      const findPromise = findDeployedContract(providers, {
        compiledContract: compiledContract as any,
        contractAddress,
        privateStateId: 'gigpayPrivateState',
        initialPrivateState: {},
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Contract not found — check that the Contract Address matches your wallet network (Preprod).')), 30000)
      );
      const deployed = await Promise.race([findPromise, timeoutPromise]) as any;

      setStatus('Proving circuit locally & submitting transaction...');
      
      // Get the caller's pubkey 
      const { shieldedCoinPublicKey } = await api.getShieldedAddresses();

      const tx = await deployed.callTx.createShieldedGig(
        projectName.padEnd(32, ' ').slice(0, 32),
        BigInt(amount),
        String(shieldedCoinPublicKey).padEnd(32, ' ').slice(0, 32),
        String(freelancerPubKey).padEnd(32, ' ').slice(0, 32)
      );

      setStatus(`Gig created successfully!`);
      setTxId(tx.public.txId);
      
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <header>
        <div className="logo-icon">🛡️</div>
        <h1>GigPay Shield</h1>
        <p className="subtitle">Privacy-first Escrow on Midnight</p>
      </header>

      <div className="hero">
        <div className="hero-section">
          <div className="hero-label hero-label--problem">⚠️ The Problem</div>
          <p className="hero-text">
            Traditional blockchain escrow exposes <strong>payment amounts</strong> and <strong>wallet identities</strong> on a public ledger — leaving freelancers and clients with zero financial privacy.
          </p>
        </div>
        <div className="hero-divider"></div>
        <div className="hero-section">
          <div className="hero-label hero-label--solution">✅ Our Solution</div>
          <p className="hero-text">
            GigPay Shield uses <strong>Zero-Knowledge proofs</strong> on Midnight to keep payment amounts and identities completely private. Only the project name and escrow count are disclosed on-chain — everything else stays hidden.
          </p>
        </div>
        <div className="hero-features">
          <span className="hero-chip">🔒 Private Amounts</span>
          <span className="hero-chip">🕵️ Hidden Identities</span>
          <span className="hero-chip">✨ ZK Proven</span>
        </div>
      </div>
      
      {!address ? (
        <div className="card text-center">
          <h2>Connect your Wallet</h2>
          <p>Please connect your Lace Midnight wallet to continue.</p>
          <button className="btn btn-primary" onClick={handleConnect}>Connect Lace</button>
          <p className="status">{status}</p>
        </div>
      ) : (
        <div className="card">
          <div className="wallet-info">
            <span className="badge">Connected</span>
            <span className="address" title={address}>
              {address.slice(0, 15)}...{address.slice(-10)}
            </span>
            <button className="btn btn-disconnect" onClick={handleDisconnect}>Disconnect</button>
          </div>

          <h2>Create Shielded Gig</h2>
          <form onSubmit={handleCreateGig}>
            <div className="form-group">
              <label>Contract Address</label>
              <input 
                type="text" 
                value={contractAddress} 
                onChange={e => setContractAddress(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Project Name</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={e => setProjectName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Amount (tNight)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Freelancer Public Key</label>
              <input 
                type="text" 
                value={freelancerPubKey} 
                onChange={e => setFreelancerPubKey(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">Create Gig (Call Circuit)</button>
          </form>

          {status && (
            <div className="alert mt-4">
              <strong>Status:</strong> {status}
            </div>
          )}

          {txId && (
            <div className="alert alert-success mt-4">
              <strong>Success!</strong> Transaction ID: <br/>
              <code>{txId}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

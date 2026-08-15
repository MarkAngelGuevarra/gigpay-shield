import { useState } from 'react';
import { connectLace, getConnectedAPI, disconnectLace } from './lib/midnight';
import { buildProviders } from './lib/providers';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract } from './managed/gigpay/contract/index';
import './index.css';

let isConnecting = false;

function App() {
  const [address, setAddress] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('0300a8927e163b2f518861ffbf113b2eeb7ed042da4936d07d1a29de7e0342eb');
  const [projectName, setProjectName] = useState('My Shielded Gig');
  const [amount, setAmount] = useState('100');
  const [freelancerPubKey, setFreelancerPubKey] = useState('mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s');
  const [status, setStatus] = useState<string>('');
  const [txId, setTxId] = useState<string>('');

  const handleConnect = async () => {
    if (isConnecting) return;

    try {
      isConnecting = true;
      setStatus('Connecting to Lace...');
      
      // Connect specifically to the Preview network where our contract lives
      const api = await connectLace('preview');
      
      const addrs = await api.getUnshieldedAddress();
      setAddress(addrs.unshieldedAddress);
      setStatus('Connected!');
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      const errorMessage = err.message || String(err);
      setStatus(errorMessage);
    } finally {
      isConnecting = false;
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
      let deployed: any = null;
      const MAX_RETRIES = 2;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) setStatus(`Finding contract... (Retry ${attempt}/${MAX_RETRIES})`);
          
          const findPromise = findDeployedContract(providers, {
            compiledContract: compiledContract as any,
            contractAddress,
            privateStateId: 'gigpayPrivateState',
            initialPrivateState: {},
          });
          
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network Timeout: The Preview indexer is unresponsive (504 Gateway Timeout). The public testnet might be congested.')), 20000)
          );
          
          deployed = await Promise.race([findPromise, timeoutPromise]) as any;
          break; // success
        } catch (err: any) {
          const msg = String(err.message || err);
          const isGenuineNotFound = msg.toLowerCase().includes('not found') && !msg.includes('Network Timeout');
          
          if (isGenuineNotFound) {
            throw new Error('Contract not found — check that the Contract Address matches your wallet network (Preview).');
          }
          
          if (attempt === MAX_RETRIES) {
            throw err;
          }
          
          // Brief delay before retrying
          await new Promise(r => setTimeout(r, 2000));
        }
      }

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

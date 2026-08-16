# How to Use GigPay Shield

## What You Need
- **Lace Wallet** browser extension installed and configured.
- The wallet network must be set to **Midnight Preview**.
- You must have some **tNIGHT** test tokens (available from the official Preview faucet).

## Step-by-Step Guide
1. **Connect Your Wallet:** Click the "Connect Lace" button on the main screen. Your Lace extension will pop up asking for authorization. Approve it to connect your wallet to the dApp.
2. **Fill Out the Gig Details:**
   - **Project Name:** Enter a recognizable name for the job (e.g., "Website Redesign").
   - **Amount:** Enter the payment amount in tNIGHT to lock in the escrow.
   - **Freelancer Public Key:** Paste the unshielded address of the freelancer you are hiring.
3. **Submit the Gig:** Click the "Create Gig" button.
4. **Approve the Proof:** The dApp will generate a Zero-Knowledge proof locally in your browser (this takes a few seconds). Your Lace wallet will then prompt you to sign the transaction. 
5. **Confirmation:** Once signed, the transaction is submitted to the Preview testnet. You will see a "Success" message with the Transaction ID once it is confirmed on-chain!

## What Gets Proved (and What Stays Private)
GigPay Shield uses Midnight's unique ZK capabilities to protect your business data:
- **What Stays Private:** The payment amount, your identity (public key), and the freelancer's identity. These are private witnesses and are *never* recorded on the public ledger.
- **What Gets Proved:** Your browser generates a Zero-Knowledge proof verifying that the mathematical rules of the escrow were followed (e.g., you actually funded the required amount).
- **What is Public:** The only data permanently visible on the public blockchain is the project name and the total count of active escrows on the platform.

## Troubleshooting
- **"Wallet is locked" error:** Make sure your Lace extension is actively unlocked. If the error persists, open Lace, go to Settings -> Authorized DApps, remove GigPay Shield, and try connecting again.
- **"Contract not found" error:** Ensure your Lace wallet network selector is set to "Midnight Preview" and not "Preprod" or "Mainnet".
- **Transaction fails to sign:** Verify you have enough tNIGHT to cover both the escrow amount and the transaction fee.

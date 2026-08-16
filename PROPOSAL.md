# Product Proposal

## What is the product, and who uses it?
GigPay Shield is a privacy-first web3 escrow platform. It is used by freelancers, independent contractors, and global clients who want to securely lock funds for a project gig without leaking their financial arrangements or business relationships to the public. 

## Why Midnight specifically?
A traditional transparent blockchain (like Ethereum or Cardano) exposes exact payment amounts, wallet identities, and transaction history to the public. For business payroll and B2B contracts, this is an unacceptable privacy violation (competitors can see exactly what you pay contractors). Midnight solves this by allowing us to use Zero-Knowledge proofs to guarantee that an escrow is fully funded and logically sound, while keeping the financial data and participant identities entirely hidden from the public ledger.

## Data Model
| Data Point | Type | Disclosed To |
|------------------|----------------|--------------|
| Total Active Escrows | Public ledger | Everyone |
| Project Name | Public ledger | Everyone |
| Payment Amount | Private witness| No one |
| Client PubKey | Private witness| No one |
| Freelancer PubKey | Private witness| No one |

## Mainnet Feasibility
Yes, it is highly realistic to reach Mainnet by Level 6. The core escrow logic is lightweight, avoiding heavy state bloat, and relies entirely on standard Compact language features (private witnesses and targeted ledger state updates) which are fully supported and stable on the network.

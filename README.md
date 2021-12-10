# solana-lookup-rust

### Deploy Program
```
cd program
cargo build-bpf
solana program deploy ./target/deploy/solsecp.so
```
### To Interact
Get Sol 
`
solana airdrop <amount>
`

Create Mint
`
spl-token create-token
`

Create Account
`
spl-token create-account <MintAddress>
`

Mint token
`
spl-token mint <MintAddress> <amount>
`

#### Run compile
```
cd scripts
npm install
npm run compile
```
#### Update key
```
update the solana secret key in keys/solanaKey.json (payer & depositor, redeemer )
update wanted secp256k1 key in keys/secp256k1.json
update lookupProgramId in keys/programId.json
```
#### To Deposit
```
// deposit native sol
npm run main <Amount>

// deposit spl-token
npm run main <Amount> <MintAddress>
```
#### To Redeem
```
// redeem native sol 
npm run main redeem

// redeem spl-token
npm run main redeem <MintAddress>
```
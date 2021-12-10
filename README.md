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

update the solana secret key in main.ts. (payer & depositor)
update wanted secp256k1 key
update lookupProgramId incase want to use new deployed program
#### Run compile
```
cd scripts
npm install
npm run compile
```
#### To Deposit
```
// deposit native sol
npm run main <number>

// deposit spl-token
npm run main <Number> <MintAddress>
```
#### To Redeem
```
// redeem native sol (wip)
npm run main redeem

// redeem spl-token
npm run main redeem <MintAddress>
```
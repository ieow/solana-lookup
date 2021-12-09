# solana-lookup-rust

### Deploy Program
```
cd program
cargo build-bpf
solana program deploy ./target/deploy/solsecp.so
```
### To Interact
```
cd scripts
npm install
npm run compile
```
#### To Deposit 
```
npm run main <Number>
```
#### To Redeem
```
npm run main redeem
```
# solana-lookup-rust

# Deploy Program
cd program
cargo build-bpf
solana program deploy ./target/deploy/solsecp.so


# To Interact
cd scripts
npm install
npm run compile
npm run main
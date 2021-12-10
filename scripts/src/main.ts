import {
  clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
  } from "@solana/web3.js";
  
import { createInitInstruction, createRedeemInstruction, createRedeemSolInstruction } from "./instruction";


import { ec as EC } from 'elliptic';
import hash from 'hash.js';
import {  createDepositInstructions } from "./lib";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
const ec = new EC('secp256k1');


async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));

  // Solana Payer's Secret Key 
  const key = Uint8Array.from(JSON.parse( fs.readFileSync(`./keys/solanaKey.json`) as unknown as string ))
  const payer = Keypair.fromSecretKey(Buffer.from(key));
  console.log("Payer ",payer.publicKey.toBase58());

  
  // secp256k1 message
  let hashValue = hash.sha256().update('daddy').digest('hex')
  // console.log(Uint8Array.from(Buffer.from(hashValue, 'hex')))
  
  // secp256k1 secret
  const secpSecretKey = JSON.parse( fs.readFileSync(`./keys/secp256k1.json`) as unknown as string );
  let pkey = ec.keyFromPrivate( secpSecretKey, 'hex')
  let pubKey = pkey.getPublic(false, 'hex')
  console.log("secp256k1PubKey" , pubKey );
  
  let signature = pkey.sign(hashValue)
  
  // lookup programId
  const readProgramId = JSON.parse( fs.readFileSync("./keys/programId.json") as unknown as string) || "96sDLTjjYx7Xn2wbCzft5UHHp7Z8j37AQ3rWRphfGeY5"
  const lookupProgramId = new PublicKey(readProgramId);
  console.log("ProgramId" , readProgramId )
  
  
  const mintAddress = process.argv[3] ? new PublicKey(process.argv[3]) : undefined ;
  console.log("mintAddress ", mintAddress?.toBase58())
  let inst; 
  if ( Number(process.argv[2]) ) {
    inst = await createDeposit( connection, pubKey, lookupProgramId, payer.publicKey, Number(process.argv[2]), mintAddress)
  } else if ( process.argv[2] === "redeem") {
    if (!mintAddress) inst = await redeemSol(pubKey, signature, hashValue, lookupProgramId, payer.publicKey); 
    else inst = await redeem ( connection,pubKey, signature, hashValue, lookupProgramId, mintAddress, payer.publicKey);
  } else {
    throw new Error("Invalid args")
  }
  
  const block = await connection.getRecentBlockhash("max");
  const transaction = new Transaction({recentBlockhash:block.blockhash})
  transaction.add(...inst);
  transaction.sign(payer);
  const res = await connection.sendTransaction(transaction,[payer]);
  console.log(res)
  return res;

}

async function createDeposit ( 
  connection: Connection, 
  secp256k1PubKey: string , 
  lookupProgramId: PublicKey, 
  payerAddress : PublicKey,
  amount: number, 
  mintAddress?: PublicKey,
  ){ 
    let secp = Buffer.from(secp256k1PubKey,"hex");
    // remove first byte 0x04
    if (secp.length === 65) secp = secp.subarray(1)
    const seeds = [secp.subarray(0,32), secp.subarray(32,64)] 
    console.log("lookup seeds",seeds)
    // create a PDA (seed = secp256k1)
    const [pda, nounce]  = await PublicKey.findProgramAddress( seeds, lookupProgramId );
    console.log("pda address and nounce",pda, nounce) 

    const instructions :TransactionInstruction[] = []
    let pdaInfo = await connection.getAccountInfo(pda);
    // Init account 
    if ( pdaInfo === null ) {
        const inst = createInitInstruction(SystemProgram.programId,lookupProgramId, payerAddress, pda, seeds  )
        instructions.push(inst);
    }

    // transfer sol or spl-token
    if (!mintAddress) {
      const transferInst = SystemProgram.transfer({ 
        fromPubkey: payerAddress,
        toPubkey: pda,
        lamports : amount * LAMPORTS_PER_SOL
      })
      instructions.push(transferInst);
    }else {
      // start deposit
      const depositInst = await createDepositInstructions(connection, new PublicKey(mintAddress), pda, payerAddress, amount);
      instructions.push(...depositInst);
    }
    return instructions;
}

async function redeem (
  connection: Connection,
  secp256k1PubKey: string,
  signature: EC.Signature,
  hashValue: string, 
  lookupProgramId: PublicKey,
  mintAddress: PublicKey,
  payerAddress: PublicKey ,
  destinationAccount?: PublicKey
  ) {
    const secpPubKey = Buffer.from(secp256k1PubKey, "hex").subarray(1);

    const seeds = [secpPubKey.subarray(0,32), secpPubKey.subarray(32,64) ] 
    const [pda, nounce] = await PublicKey.findProgramAddress( seeds, lookupProgramId ); 
    console.log("pda", pda.toBase58());

    const sourceAccount = await Token.getAssociatedTokenAddress( ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAddress, pda, true);
    const sourceAccountInfo = await connection.getAccountInfo(sourceAccount);
    if (!sourceAccountInfo) throw new Error(`Account do not have ${mintAddress.toBase58()} Token`)

    const destinationAssocAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAddress, payerAddress);
    
    const signature64 = Buffer.concat ( [signature.r.toBuffer(), signature.s.toBuffer()]);
    const payload = { hash : [Buffer.from(hashValue, "hex")] , signature : [signature64], recovery_id : signature.recoveryParam === null ? [Buffer.from([0])] : [Buffer.from([signature.recoveryParam])] }    
    // const payload = { hash : [Buffer.from(hashValue)] , signature : [Buffer.from(secpPubKey.subarray(0,64))], recovery_id : [Buffer.from([0])] }    

    const inst = createRedeemInstruction(
        lookupProgramId,
        sourceAccount,
        mintAddress,
        destinationAccount || destinationAssocAccount,
        pda,
        payerAddress,
        payload
    )
    return [inst]
}

async function redeemSol (
  secp256k1PubKey: string,
  signature: EC.Signature,
  hashValue: string, 
  lookupProgramId: PublicKey,
  payerAddress: PublicKey ,
) {
  const secpPubKey = Buffer.from(secp256k1PubKey, "hex").subarray(1);

  const seeds = [secpPubKey.subarray(0,32), secpPubKey.subarray(32,64) ] 
  const [pda, nounce] = await PublicKey.findProgramAddress( seeds, lookupProgramId ); 
  console.log("pda", pda.toBase58());
  const signature64 = Buffer.concat ( [signature.r.toBuffer(), signature.s.toBuffer()]);
  const payload = { hash : [Buffer.from(hashValue, "hex")] , signature : [signature64], recovery_id : signature.recoveryParam === null ? [Buffer.from([0])] : [Buffer.from([signature.recoveryParam])] }    
  const inst = createRedeemSolInstruction(
    lookupProgramId,
    pda,
    payerAddress,
    payload
  )
  return [inst]
}
main()
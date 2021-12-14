import {
  clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    Transaction,
  } from "@solana/web3.js";
  

import { ec as EC } from 'elliptic';
import hash from 'hash.js';
import {  createDeposit, createDepositInstructions, redeemSplToken, redeemSol } from "./lib";
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
    else inst = await redeemSplToken ( connection,pubKey, signature, hashValue, lookupProgramId, mintAddress, payer.publicKey);
  } else if ( process.argv[2] === "accounts") {
    await showAccount(connection, pubKey, lookupProgramId);
    return 
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

async function showAccount ( connection:Connection, secp256k1PubKey : string, lookupProgramId:PublicKey) {
  let secp = Buffer.from(secp256k1PubKey,"hex");
    // remove first byte 0x04
    if (secp.length === 65) secp = secp.subarray(1)
    const seeds = [secp.subarray(0,32), secp.subarray(32,64)] 
    console.log("lookup seeds",seeds)
    // create a PDA (seed = secp256k1)
    const [pda, nounce]  = await PublicKey.findProgramAddress( seeds, lookupProgramId ); 
    
    console.log("Program Derived Account\n",  pda.toBase58() );
    // await connection.getAccountInfo(pda))
    
    console.log("Token Account ")
    const result = await connection.getTokenAccountsByOwner(pda, { 
      programId : TOKEN_PROGRAM_ID
    });

    result.value.forEach( item => console.log( item.pubkey.toBase58() ))
}

main()
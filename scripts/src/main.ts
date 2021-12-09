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
  
import { createInitInstruction, createRedeemInstruction } from "./instruction";


import { ec as EC } from 'elliptic';
import hash from 'hash.js';
import {  createDepositInstructions } from "./lib";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const ec = new EC('secp256k1');


async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));


  // Solana Payer's Secret Key 
  // const key = [65,46,236,110,208,109,47,11,84,189,37,203,15,127,180,41,4,132,208,61,118,105,162,92,204,146,200,110,194,135,56,40,81,30,39,173,213,216,117,11,203,45,95,237,49,168,175,13,141,126,97,67,254,42,181,25,133,92,216,56,120,247,175,64] 
  const key = [4,114,247,187,204,2,163,79,77,100,0,136,237,39,172,131,93,144,69,5,114,124,118,127,51,168,206,63,92,3,188,201,31,127,166,167,131,155,105,59,214,22,11,93,115,224,182,190,3,17,177,9,165,86,244,109,134,161,178,38,1,152,228,93]
  const payer = Keypair.fromSecretKey(Buffer.from(key));
  console.log(payer.publicKey.toBase58());

  
  // secp256k1 message
  let hashValue = hash.sha256().update('daddy').digest('hex')
  console.log(Uint8Array.from(Buffer.from(hashValue, 'hex')))
  
  // secp256k1 secret
  let KEY = '9f26ca20d290adfb31255c82eaafb931e5ccb2d3e0ff7891c0b7c012c97d5cb7'
  let pkey = ec.keyFromPrivate(KEY, 'hex')
  let pubKey = pkey.getPublic(false, 'hex')
  // console.log("secp256k1PubKey", Uint8Array.from(Buffer.from(pubKey, 'hex')))
  console.log("secp256k1PubKey" , pubKey );
  
  let signature = pkey.sign(hashValue)
  
  // const lookupProgramId = new PublicKey("CPmEJAGR13X19st1LXHMRbUMiMdh3Xpk7JMwdH264ceB");
  const lookupProgramId = new PublicKey("96sDLTjjYx7Xn2wbCzft5UHHp7Z8j37AQ3rWRphfGeY5");
  // const mintAddress = "pX36m9jc1BfdxUVgjvk8Rj6Aqqvkdzgj36AkabDDjPS";
  const mintAddress = new PublicKey("BogPYCbnXevkaypTxTznJmGaJ1EdG9Dbf6rQ1h47KjvB");
  // const mintAddress ="GU7eu5XzArRDFJ7WhRnFj1a6TpZ67AYNXMBzamd4hxtY";
  
  const inst = await createDeposit( connection, pubKey, lookupProgramId, mintAddress, payer.publicKey, 1)
  // const inst = await redeem ( connection,pubKey, signature, hashValue, lookupProgramId, mintAddress, payer.publicKey)
  
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
  mintAddress: PublicKey,
  payerAddress : PublicKey,
  amount: number 
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
    if ( pdaInfo === null ) {
        const inst = createInitInstruction(SystemProgram.programId,lookupProgramId, payerAddress, pda, seeds  )
        instructions.push(inst);
    }

    // start deposit
    const deposit = await createDepositInstructions(connection, new PublicKey(mintAddress), pda, payerAddress, amount);
    instructions.push(...deposit);
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
main()
// redeem( lookupProgramId, new PublicKey(mintAddress), pk)
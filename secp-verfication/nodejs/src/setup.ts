import {
  clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
  } from "@solana/web3.js";
  
  import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createInitInstruction } from "./instruction";


import { ec as EC} from 'elliptic';
import hash from 'hash.js';
import { createLookUpAcc, deposit } from "./lib";

var ec = new EC('secp256k1');

let hashValue = hash.sha256().update('daddy').digest('hex')
console.log(Uint8Array.from(Buffer.from(hashValue, 'hex')))

let KEY = '9f26ca20d290adfb31255c82eaafb931e5ccb2d3e0ff7891c0b7c012c97d5cb7'
let pkey = ec.keyFromPrivate(KEY, 'hex')
let pubKey = pkey.getPublic(false, 'hex')
console.log(Uint8Array.from(Buffer.from(pubKey, 'hex')))

let signature = pkey.sign(hashValue)
// const lookupProgramId = new PublicKey("CPmEJAGR13X19st1LXHMRbUMiMdh3Xpk7JMwdH264ceB");
const lookupProgramId = new PublicKey("96sDLTjjYx7Xn2wbCzft5UHHp7Z8j37AQ3rWRphfGeY5");

async function main(payer: Keypair) {
  
  // const payer = Keypair.fromSecretKey("");
  // const lookupAccountKey = await PublicKey.createProgramAddress( [], lookupProgramId);
  
  
  // const instruction = createInitInstruction(
  //   SystemProgram.programId,
  //   lookupProgramId,
  //   payer.publicKey,
  //   lookupAccountKey,
  //   [Buffer.from(pubKey, "hex")],
  // )
    
    let transaction = new Transaction();
    // transaction.add(instruction)
    const connection = new Connection(clusterApiUrl("devnet"));
    const block = await connection.getRecentBlockhash("max");
    transaction.recentBlockhash = block.blockhash;
    transaction.sign(payer)
    // await connection.sendTransaction(transaction, [payer]);
    
    const lookupTransaction = new Transaction({recentBlockhash: block.blockhash})
    
    // const mintAddress = "pX36m9jc1BfdxUVgjvk8Rj6Aqqvkdzgj36AkabDDjPS";
    // const mintAddress = "BogPYCbnXevkaypTxTznJmGaJ1EdG9Dbf6rQ1h47KjvB";
    const mintAddress ="GU7eu5XzArRDFJ7WhRnFj1a6TpZ67AYNXMBzamd4hxtY";
    const secp =Buffer.from(pubKey,"hex") 
    console.log(secp.length)
    // console.log(secp.subarray(64).length)
    // const lookupInstruction = await createLookUpAcc(connection, [secp.subarray(0,32), secp.subarray(32,64), secp.subarray(64) ], lookupProgramId, pk.publicKey )
    const seeds = [secp.subarray(0,32), secp.subarray(32,64), secp.subarray(64) ] 
    console.log("creaetlookup",seeds)
    // create a PDA (seed = secp256k1)
    const [pda, nounce]  = await PublicKey.findProgramAddress( seeds, lookupProgramId );
    console.log(pda) 
    console.log(nounce)
    let pdaInfo = await connection.getAccountInfo(pda);
    // console.log(pdaInfo)
    if ( pdaInfo === null ) {
        const inst = createInitInstruction(SystemProgram.programId,lookupProgramId, payer.publicKey, pda, seeds  )
        lookupTransaction.add(inst);
    }
    const depositInstruction = await deposit(connection, new PublicKey(mintAddress), pda, payer.publicKey, 1);
    depositInstruction.forEach( (inst)=>{
      lookupTransaction.add(inst)
    })


    // if (lookupInstruction) lookupTransaction.add)
    // lookupTransaction.sign(pk)
    // await connection.sendRawTransaction( lookupTransaction.serialize());
    await connection.sendTransaction( lookupTransaction, [pk])
}

// const key = [65,46,236,110,208,109,47,11,84,189,37,203,15,127,180,41,4,132,208,61,118,105,162,92,204,146,200,110,194,135,56,40,81,30,39,173,213,216,117,11,203,45,95,237,49,168,175,13,141,126,97,67,254,42,181,25,133,92,216,56,120,247,175,64] 
const key = [4,114,247,187,204,2,163,79,77,100,0,136,237,39,172,131,93,144,69,5,114,124,118,127,51,168,206,63,92,3,188,201,31,127,166,167,131,155,105,59,214,22,11,93,115,224,182,190,3,17,177,9,165,86,244,109,134,161,178,38,1,152,228,93]
const pk = Keypair.fromSecretKey(Buffer.from(key));
console.log(pk.publicKey.toBase58());
main(pk)

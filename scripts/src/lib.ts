import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, ParsedAccountData, PublicKey, SystemProgram, Transaction, TransactionInstruction,  } from "@solana/web3.js"
import { createInitInstruction, createRedeemInstruction, createRedeemSolInstruction } from "./instruction";

import { ec as EC } from 'elliptic';
// export const createLookUpAcc = async (connection: Connection, seeds:( Buffer| Uint8Array )[], lookUpProgramId: PublicKey, payer: PublicKey) =>{
//     // create a PDA (seed = secp256k1)
//     const [pda, _nounce] = await PublicKey.findProgramAddress( seeds, lookUpProgramId);
//     console.log(pda)
//     // check for pda generated 
//     let pdaInfo = await connection.getAccountInfo(pda);
//     const instructions: TransactionInstruction[] = [] 
//     if ( pdaInfo === null ) {
//         // or call Program instruction to create account
//         // calculate lamport for rent free
//         const instruction = SystemProgram.createAccount( {
//             /** The account that will transfer lamports to the created account */
//             fromPubkey: payer,
//             /** Public key of the created account */
//             newAccountPubkey: pda,
//             /** Amount of lamports to transfer to the created account */
//             lamports: 0.1,
//             /** Amount of space in bytes to allocate to the created account */
//             space: 64,
//             /** Public key of the program to assign as the owner of the created account */
//             programId: lookUpProgramId,
//         })

//         instructions.push(instruction)
//     } 
//     // update the pda account data with email address
//     return instructions
// }
export const createLookUpAcc = async(connection:Connection, seeds:(Buffer|Uint8Array)[],  lookUpProgramId: PublicKey, payer: PublicKey)  =>{
    console.log("creaetlookup",seeds)
    // create a PDA (seed = secp256k1)
    const [pda, nounce]  = await PublicKey.findProgramAddress( seeds, lookUpProgramId );
    // const pda  = await PublicKey.findProgramAddress( [payer.toBuffer()], lookUpProgramId );
    console.log(pda) 
    console.log(nounce)
    let pdaInfo = await connection.getAccountInfo(pda);
    // console.log(pdaInfo)
    if ( pdaInfo === null ) {
        return createInitInstruction(SystemProgram.programId,lookUpProgramId, payer, pda, seeds  )
    }
    return  undefined 
}

export const createDepositInstructions = async (connection: Connection, mintAddress:PublicKey, pda: PublicKey, payerAddress: PublicKey, amount: number) =>{
    const instructions : TransactionInstruction[] = []
    const associatedAddress = await Token.getAssociatedTokenAddress( ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAddress, pda , true);
    const assocAcc = await connection.getParsedAccountInfo(associatedAddress)
    const mintAcc = await connection.getParsedAccountInfo(mintAddress);
    
    const sourceAddress = await Token.getAssociatedTokenAddress( ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAddress, payerAddress )
    console.log("payer Source Token Account", sourceAddress.toBase58())
    console.log("Token Associate Account", associatedAddress.toBase58())
    const decimals = (mintAcc.value?.data as ParsedAccountData ).parsed.info.decimals;
    if (assocAcc.value === null) {
        // create associated token address
        const initInstruction = Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAddress, associatedAddress, pda,  payerAddress)
        instructions.push(initInstruction);
    }
    const transferInst = Token.createTransferCheckedInstruction( TOKEN_PROGRAM_ID, sourceAddress, mintAddress, associatedAddress, payerAddress, [], amount * 10 ** decimals, decimals);
    instructions.push(transferInst);
    return instructions
}



export async function createDeposit ( 
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
      // Init account is required to assign pda to programId, else it will be assiged to SystemProgram (which program will not able to spend sol from the account).
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
  
export async function redeemSplToken (
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
      
      const signature64 = Buffer.concat ( [Buffer.from(signature.r.toArray()), Buffer.from(signature.s.toArray())]);
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
  
export async function redeemSol (
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
    const signature64 = Buffer.concat ( [Buffer.from(signature.r.toArray()), Buffer.from(signature.s.toArray())]);
    const payload = { hash : [Buffer.from(hashValue, "hex")] , signature : [signature64], recovery_id : signature.recoveryParam === null ? [Buffer.from([0])] : [Buffer.from([signature.recoveryParam])] }    
    const inst = createRedeemSolInstruction(
      lookupProgramId,
      pda,
      payerAddress,
      payload
    )
    return [inst]
  }
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, ParsedAccountData, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import { createInitInstruction } from "./instruction";

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

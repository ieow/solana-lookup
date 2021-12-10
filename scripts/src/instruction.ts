import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';

export enum Instruction {
  Verify,
  Init,
  Redeem,
  RedeemSol
}

export function createInitInstruction(
  systemProgramId: PublicKey,
  lookupProgramId: PublicKey,
  payerKey: PublicKey,
  lookupAccountKey: PublicKey,
  seeds: Array<Buffer | Uint8Array>,
): TransactionInstruction {
  const inst_type = Buffer.from(Uint8Array.of(Instruction.Init));
  const data = Buffer.concat([inst_type, ...seeds])
  const keys = [
    {
      pubkey: systemProgramId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payerKey,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: lookupAccountKey,
      isSigner: false,
      isWritable: true,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: lookupProgramId,
    data: data, 
  });
}


export function createRedeemInstruction(
  lookupProgramId : PublicKey,
  sourceAccount: PublicKey,
  mintAccount: PublicKey,
  destinationAccount: PublicKey,
  lookupAccountKey: PublicKey,
  payerKey: PublicKey,
  payloadData: {
    hash: Array<Buffer | Uint8Array>,
    signature: Array<Buffer | Uint8Array>,
    recovery_id: Array<Buffer | Uint8Array>,
  }
): TransactionInstruction {
  const inst_type = Buffer.from(Uint8Array.of(Instruction.Redeem));
  const data = Buffer.concat([inst_type, ...payloadData.hash, ...payloadData.signature, ...payloadData.recovery_id ])
  const keys = [
    {
      pubkey: sourceAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: mintAccount,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: destinationAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: lookupAccountKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payerKey,
      isSigner: true,
      isWritable: true,
    },
    {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner : false,
        isWritable: false,
    }
  ];
  return new TransactionInstruction({
    keys,
    programId: lookupProgramId,
    data: data, 
  });
}


export function createRedeemSolInstruction(
  lookupProgramId : PublicKey,
  lookupAccountKey: PublicKey,
  payerKey: PublicKey,
  payloadData: {
    hash: Array<Buffer | Uint8Array>,
    signature: Array<Buffer | Uint8Array>,
    recovery_id: Array<Buffer | Uint8Array>,
  }
): TransactionInstruction {
  const inst_type = Buffer.from(Uint8Array.of(Instruction.RedeemSol));
  const data = Buffer.concat([inst_type, ...payloadData.hash, ...payloadData.signature, ...payloadData.recovery_id ])
  const keys = [
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: lookupAccountKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payerKey,
      isSigner: true,
      isWritable: true,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: lookupProgramId,
    data: data, 
  });
}

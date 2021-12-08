import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN = require('bn.js');

export enum Instruction {
  Init,
  Create,
}

export function createInitInstruction(
  systemProgramId: PublicKey,
  lookupProgramId: PublicKey,
  payerKey: PublicKey,
  lookupAccountKey: PublicKey,
  seeds: Array<Buffer | Uint8Array>,
): TransactionInstruction {
    const inst_type = Buffer.from(Uint8Array.of(1));
    const data = Buffer.concat([inst_type, ...seeds])
    console.log(seeds);
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
  console.log(data.length)
  return new TransactionInstruction({
    keys,
    programId: lookupProgramId,
    data: data, 
  });
}


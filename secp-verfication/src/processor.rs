use solana_program::{
    account_info::{next_account_info, AccountInfo},
    decode_error::DecodeError,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    pubkey::Pubkey,
    secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey}
};
use std::str;
use self::str::{from_utf8};

use crate::{error::VestingError, instructions::VerificationInstruction};

pub struct Processor {}

impl Processor {
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        msg!("Beginning processing");
        let instruction = VerificationInstruction::unpack(instruction_data)?;
        msg!("Instruction unpacked");
        match instruction {
            VerificationInstruction::Verify {
                hash, recovery_id, signature
            } => {
                msg!("Instruction: Init");
                Self::verify_signature(&hash, recovery_id, &signature)
            }
        }
    }

    pub fn verify_signature(
        hash: &[u8],
        recovery_id: u8,
        signature: &[u8]
    ) -> ProgramResult {
        let pubkey = secp256k1_recover(hash, recovery_id, signature).unwrap();
        msg!("pubkey {:?}", pubkey.to_bytes());
        Ok(())
    }
}
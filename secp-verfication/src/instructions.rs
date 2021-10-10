
use crate::error::VerificationError;

use std::convert::TryInto;
use std::mem::size_of;

use solana_program::{
    instruction::{AccountMeta, Instruction},
    msg,
    program_error::ProgramError,
    pubkey::Pubkey
};

pub enum VerificationInstruction{
    Verify {
        publicKey: [u8; 64],
        hash: [u8; 64],
        signature: [u8; 64],
        recovery_id: u8,
    }
}

impl VerificationInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        use VerificationError::InvalidInstruction;
        let (&tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            0 => {

                let publicKey: [u8; 64] = rest
                    .get(..64)
                    .and_then(|slice| slice.try_into().ok())
                    .unwrap();

                let hash: [u8; 64] = rest
                    .get(64..128)
                    .and_then(|slice| slice.try_into().ok())
                    .unwrap();

                let signature: [u8; 64] = rest
                    .get(128..216)
                    .and_then(|slice| slice.try_into().ok())
                    .unwrap();
                
                let id = rest
                    .get(216..217)
                    .and_then(|slice| slice.try_into().ok())
                    .map(u8::from_le_bytes)
                    .ok_or(InvalidInstruction)?;

                Self::Verify{
                    publicKey,
                    hash,
                    recovery_id: id,
                    signature
                }
            }
            _ => {
                msg!("Unsupported tag");
                return Err(InvalidInstruction.into());
            }
        })
    }
}
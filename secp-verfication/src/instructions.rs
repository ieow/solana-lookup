
use crate::error::VestingError;

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
        hash: [u8; 64],
        recovery_id: u8,
        signature: [u8; 64],
    }
}

impl VerificationInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        use VestingError::InvalidInstruction;
        let (&tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            0 => {
                let hash: [u8; 64] = rest
                    .get(..64)
                    .and_then(|slice| slice.try_into().ok())
                    .unwrap();
                
                let id = rest
                    .get(64..65)
                    .and_then(|slice| slice.try_into().ok())
                    .map(u8::from_le_bytes)
                    .ok_or(InvalidInstruction)?;
                
                let signature: [u8; 64] = rest
                    .get(65..129)
                    .and_then(|slice| slice.try_into().ok())
                    .unwrap();


                Self::Verify{
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
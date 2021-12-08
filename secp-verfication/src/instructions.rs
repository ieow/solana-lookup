
use crate::error::VerificationError;
use std::convert::TryInto;

use solana_program::{
    msg,
    program_error::ProgramError,
};

pub enum LookUpInstruction{
    Verify {
        public_key: [u8; 64],
        hash: [u8; 64],
        signature: [u8; 64],
        recovery_id: u8,
    },
    Init {
        public_key: [u8; 65],
        // seeds : [[u8;32];3]
    },
    Redeem {
        public_key: [u8; 64],
        hash: [u8; 64],
        signature: [u8; 64],
        recovery_id: u8,
    }
}

impl LookUpInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        use VerificationError::InvalidInstruction;
        let (&tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            0 => {

                let public_key: [u8; 64] = rest
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
                    public_key,
                    hash,
                    recovery_id: id,
                    signature
                }
            }
            1 => {

                let public_key: [u8; 65] = rest
                    .get(..65)
                    .and_then(|slice| slice.try_into().ok())
                    .unwrap();
                Self::Init{
                    public_key
                }
            }
            2 => {
                let public_key: [u8; 64] = rest
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
                    
                Self::Redeem{
                    public_key,
                    hash,
                    recovery_id: id,
                    signature,
                }
            }
            _ => {
                msg!("Unsupported tag");
                return Err(InvalidInstruction.into());
            }
        })
    }
}
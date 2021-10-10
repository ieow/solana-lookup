use solana_program::{decode_error::DecodeError, program_error::ProgramError};
use thiserror::Error;

/// Errors that may be returned by the Token vesting program.
#[derive(Clone, Debug, Eq, Error, PartialEq)]
pub enum VerificationError {
    // Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction
}

impl From<VerificationError> for ProgramError {
    fn from(e: VerificationError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for VerificationError {
    fn type_of() -> &'static str {
        "VerificationError"
    }
}

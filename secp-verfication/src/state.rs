use solana_program::{pubkey::Pubkey, program_pack::{Sealed, Pack}, program_error::ProgramError};


#[derive(Debug, PartialEq)]
pub struct VestingScheduleHeader {
    pub destination_address: Pubkey,
    pub mint_address: Pubkey,
    pub is_initialized: bool,
}

impl Sealed for VestingScheduleHeader {}

impl Pack for VestingScheduleHeader {
    const LEN: usize = 66;

    fn pack_into_slice(&self, target: &mut [u8]) {
        let destination_address_bytes = self.destination_address.to_bytes();
        let mint_address_bytes = self.mint_address.to_bytes();
        for i in 0..32 {
            target[i] = destination_address_bytes[i];
        }

        for i in 32..64 {
            target[i] = mint_address_bytes[i - 32];
        }

        target[64] = self.is_initialized as u8;
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        if src.len() < 65 {
            return Err(ProgramError::InvalidAccountData)
        }
        let destination_address = Pubkey::new(&src[..32]);
        let mint_address = Pubkey::new(&src[32..64]);
        let is_initialized = src[66] == 1;
        Ok(Self {
            destination_address,
            mint_address,
            is_initialized,
        })
    }
}
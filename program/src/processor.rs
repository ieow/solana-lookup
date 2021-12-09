use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    secp256k1_recover::{secp256k1_recover },
    rent::Rent, 
    program_error::ProgramError, 
    program::invoke_signed,
    system_instruction::create_account, sysvar::Sysvar, program_pack::Pack, 
    
};
use spl_token::state::Account as TokenAccount;
use spl_token::state::Mint as MintAccount;

use crate::{instructions::LookUpInstruction, state::VestingScheduleHeader};

pub struct Processor {}

impl Processor {
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = LookUpInstruction::unpack(instruction_data)?;
        match instruction {
            LookUpInstruction::Verify {
                hash, recovery_id, signature, public_key
            } => {
                msg!("Instruction: Init");
                Self::verify_signature(&public_key, &hash,&signature, recovery_id)
            }
            LookUpInstruction::Init{
                public_key
            } => {
                msg!("Instruction: Init");
                Self::init_account(program_id, accounts, &public_key)
            }
            LookUpInstruction::Redeem{
                hash, recovery_id,signature 
            } => {
                msg!("Instruction: Redeem");
                Self::redeem( program_id, accounts,  &hash, &signature, recovery_id )
            }
        }
    }

    pub fn init_account ( 
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        public_key : &[u8]) -> ProgramResult {
        let accounts_iter = &mut accounts.iter();

        let system_program_account = next_account_info(accounts_iter)?;
        let rent_sysvar_account = next_account_info(accounts_iter)?;
        let payer = next_account_info(accounts_iter)?;
        let lookup_account = next_account_info(accounts_iter)?;

        let rent = Rent::from_account_info(rent_sysvar_account)?;

        let s1 = public_key.get(..32).unwrap();
        let s2 = public_key.get(32..64).unwrap();
        let mut seed= vec![s1,s2];
        // // Find the non reversible public key for the vesting contract via the seed
        let (lookup_account_key, bump_seed) = Pubkey::try_find_program_address(&seed, &program_id).unwrap();
        if lookup_account_key != *lookup_account.key {
            msg!("Provided vesting account is invalid");
            return Err(ProgramError::InvalidArgument);
        }

        let a_bump_seed = [bump_seed];
        seed = vec![s1,s2,&a_bump_seed];
        msg!("{:?}", &lookup_account_key);

        let state_size =  VestingScheduleHeader::LEN;

        let init_vesting_account = create_account(
            &payer.key,
            &lookup_account_key,
            rent.minimum_balance(state_size),
            state_size as u64,
            &program_id,
        );
        invoke_signed(
            &init_vesting_account,
            &[
                system_program_account.clone(),
                payer.clone(),
                lookup_account.clone(),
            ],
            &[&seed],
        )?;
        Ok(())
    }




    pub fn verify_signature(
        public_key: &[u8],
        hash: &[u8],
        signature: &[u8],
        recovery_id: u8
    ) -> ProgramResult {
        let pubkey = secp256k1_recover(hash, recovery_id, signature).unwrap();
        let pubkey_bytes = pubkey.to_bytes();

        if public_key == pubkey_bytes {
            msg!("verification done")
        }else{
            msg!("verification failed")
        }

        msg!("pubkey {:?}", pubkey.to_bytes());
        Ok(())
    }

    pub fn redeem(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        hash: &[u8],
        signature: &[u8],
        recovery_id: u8,
    ) -> ProgramResult {
        let pubkey = secp256k1_recover(hash, recovery_id, signature).unwrap();
        let pubkey_bytes = pubkey.to_bytes();
        let s1 = pubkey_bytes.get(0..32).unwrap();
        let s2 = pubkey_bytes.get(32..64).unwrap();
        
        // let s1 = signature.get(0..32).unwrap();
        // let s2 = signature.get(32..64).unwrap();
        let mut seeds = vec![s1,s2 ];

        let accounts_iter = &mut accounts.iter();

        let source_account = next_account_info(accounts_iter)?;
        let mint_account = next_account_info(accounts_iter)?;
        let destination_account = next_account_info(accounts_iter)?;
        let lookup_account = next_account_info(accounts_iter)?;
        let payer_account = next_account_info(accounts_iter)?;
        let token_program_account = next_account_info(accounts_iter)?;
        
        let source_token = TokenAccount::unpack(&source_account.try_borrow_data()?)?;
        let mint_token= MintAccount::unpack(&mint_account.try_borrow_data()?)?;
        
        // find pda Account from secp256 pubkey to match lookup_account.key
        // Find the non reversible public key for the vesting contract via the seed
        let (lookup_account_key, bump_seed) = Pubkey::try_find_program_address(&seeds, &program_id).unwrap();
        if lookup_account_key != *lookup_account.key {
            msg!("verification failed");
            msg!("Provided lookup account is invalid {:?}", &lookup_account_key );
            return Err(ProgramError::InvalidArgument);
        }
        let b_seed = [bump_seed];
        seeds.push(&b_seed);
        
        msg!("verification done");
        // transfer token to destination
        let transfer = spl_token::instruction::transfer_checked( 
            &token_program_account.key, 
            // &spl_token::id(),
            &source_account.key, 
            &mint_account.key, 
            &destination_account.key,
            &lookup_account.key, 
            &[],
            source_token.amount, 
            mint_token.decimals
        )?;

        invoke_signed(&transfer,
            &[
                source_account.clone(),
                destination_account.clone(),
                mint_account.clone(),
                lookup_account.clone(),
                token_program_account.clone(),
            ],
            &[&seeds]
        )?;        
        
        // close token acc transfer sol to dest 
        let close_account = spl_token::instruction::close_account(
            &spl_token::id(),
            &source_account.key,
            &payer_account.key, 
            &lookup_account.key, 
            &[]
        )?;

        invoke_signed( &close_account,
            &[
                source_account.clone(),
                payer_account.clone(),
                lookup_account.clone()
            ],
            &[&seeds]
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    // use libsecp256k1::Signature;
    use solana_program::secp256k1_recover::{secp256k1_recover};
    // use solana_sdk::{secp256k1_instruction::SecpSignatureOffsets, signature::Signature};

    #[test]
    fn it_works() {
        let expected: [u8; 64] = [
        147, 196, 165,  43, 222,  11, 171, 216,  33, 192,
    89,  39, 205,  66, 255, 208, 100, 145, 116, 235,  49,
    73, 220,  81,  18, 128,  85,  65,  95,  51, 181, 219,
    68,  31, 114, 234,  56, 140,  71, 112, 160, 216, 206,
    94, 156,  83, 134, 201,  38, 100, 234, 129, 113, 193,
    216, 253, 177,  48, 239,  68, 112,  63,  16, 240
            ];

        let hash: [u8; 32] = [
            86, 157, 125, 193,  97,  27,  80, 228,
            13,  91, 137, 140,  33,  47,  71,  66,
        227, 183, 215, 105, 150, 186, 197, 214,
            55,  57, 254, 245, 137, 243, 204, 192
        ];
        let recovery_id: u8 = 1;
        let signatureDER: [u8; 70] =  [
            48,  68,   2,  32,  52, 254, 245, 123, 137, 138,  25, 27,
            4, 199,  27, 250, 209, 125,  20, 136, 254, 173, 162, 85,
        237, 197,  57, 152,   3, 173,  67, 223, 154, 200, 101, 42,
            2,  32, 120,  47, 104,  23, 141,  17, 173, 120, 164, 89,
        127,   7, 206,  19, 181, 130, 253,  10,  93, 176, 227, 16,
        223, 115, 161, 102, 149,  89, 206,  19, 189, 245
        ];

        //  let sig: Signature = Signature::parse_der(&signatureDER).unwrap();
        //  let serializedsig = Signature::serialize(&sig);

        let pubkey = secp256k1_recover(&hash, recovery_id, &signatureDER).unwrap();
        println!("pubkey {:?}", pubkey.to_bytes())
    }
}
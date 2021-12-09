#![cfg(feature = "test-bpf")]

use secp_verfication::instructions::{VerificationInstruction};
use secp_verfication::processor::{Processor};
use solana_program::secp256k1_recover::{secp256k1_recover};

#[test]
fn test_ecrecover(){
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
    let signature: [u8; 64] = [
        48,  68,   2,  32,  52, 254, 245, 123, 137, 138,  25, 27,
         4, 199,  27, 250, 209, 125,  20, 136, 254, 173, 162, 85,
       237, 197,  57, 152,   3, 173,  67, 223, 154, 200, 101, 42,
         2,  32, 120,  47, 104,  23, 141,  17, 173, 120, 164, 89,
       127,   7, 206,  19, 181, 130, 253,  10,  93, 176, 227, 16,
       223, 115, 161, 102, 149,  89, 206,  19, 189, 245
     ];

    let pubkey = secp256k1_recover(&hash, recovery_id, &signature).unwrap();
    assert_eq!(public_key.to_bytes(), expected);

    println!("pubkey {:?}", pubkey.to_bytes())
}
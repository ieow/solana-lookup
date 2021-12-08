"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.redeem = exports.deposit = exports.createLookUpAcc = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var instruction_1 = require("./instruction");
// export const createLookUpAcc = async (connection: Connection, seeds:( Buffer| Uint8Array )[], lookUpProgramId: PublicKey, payer: PublicKey) =>{
//     // create a PDA (seed = secp256k1)
//     const [pda, _nounce] = await PublicKey.findProgramAddress( seeds, lookUpProgramId);
//     console.log(pda)
//     // check for pda generated 
//     let pdaInfo = await connection.getAccountInfo(pda);
//     const instructions: TransactionInstruction[] = [] 
//     if ( pdaInfo === null ) {
//         // or call Program instruction to create account
//         // calculate lamport for rent free
//         const instruction = SystemProgram.createAccount( {
//             /** The account that will transfer lamports to the created account */
//             fromPubkey: payer,
//             /** Public key of the created account */
//             newAccountPubkey: pda,
//             /** Amount of lamports to transfer to the created account */
//             lamports: 0.1,
//             /** Amount of space in bytes to allocate to the created account */
//             space: 64,
//             /** Public key of the program to assign as the owner of the created account */
//             programId: lookUpProgramId,
//         })
//         instructions.push(instruction)
//     } 
//     // update the pda account data with email address
//     return instructions
// }
var createLookUpAcc = function (connection, seeds, lookUpProgramId, payer) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, pda, nounce, pdaInfo;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("creaetlookup", seeds);
                return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress(seeds, lookUpProgramId)];
            case 1:
                _a = _b.sent(), pda = _a[0], nounce = _a[1];
                // const pda  = await PublicKey.findProgramAddress( [payer.toBuffer()], lookUpProgramId );
                console.log(pda);
                console.log(nounce);
                return [4 /*yield*/, connection.getAccountInfo(pda)];
            case 2:
                pdaInfo = _b.sent();
                // console.log(pdaInfo)
                if (pdaInfo === null) {
                    return [2 /*return*/, (0, instruction_1.createInitInstruction)(web3_js_1.SystemProgram.programId, lookUpProgramId, payer, pda, seeds)];
                }
                return [2 /*return*/, undefined];
        }
    });
}); };
exports.createLookUpAcc = createLookUpAcc;
var deposit = function (connection, mintAddress, pda, payer, amount) { return __awaiter(void 0, void 0, void 0, function () {
    var instructions, associatedAddress, assocAcc, mintAcc, sourceAddress, decimals, initInstruction, transferInst;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log(pda.toBase58());
                instructions = [];
                return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mintAddress, pda, true)];
            case 1:
                associatedAddress = _b.sent();
                return [4 /*yield*/, connection.getParsedAccountInfo(associatedAddress)];
            case 2:
                assocAcc = _b.sent();
                return [4 /*yield*/, connection.getParsedAccountInfo(mintAddress)];
            case 3:
                mintAcc = _b.sent();
                return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mintAddress, payer)];
            case 4:
                sourceAddress = _b.sent();
                console.log(mintAcc);
                console.log(associatedAddress.toBase58());
                console.log(sourceAddress.toBase58());
                decimals = ((_a = mintAcc.value) === null || _a === void 0 ? void 0 : _a.data).parsed.info.decimals;
                console.log(decimals);
                console.log(assocAcc);
                if (assocAcc.value === null) {
                    initInstruction = spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mintAddress, associatedAddress, pda, payer);
                    instructions.push(initInstruction);
                }
                transferInst = spl_token_1.Token.createTransferCheckedInstruction(spl_token_1.TOKEN_PROGRAM_ID, sourceAddress, mintAddress, associatedAddress, payer, [], amount * Math.pow(10, decimals), decimals);
                instructions.push(transferInst);
                return [2 /*return*/, instructions];
        }
    });
}); };
exports.deposit = deposit;
var redeem = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // create redeem instruction
        // send instruction
        return [2 /*return*/];
    });
}); };
exports.redeem = redeem;

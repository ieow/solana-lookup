"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.createInitInstruction = exports.Instruction = void 0;
var web3_js_1 = require("@solana/web3.js");
var Instruction;
(function (Instruction) {
    Instruction[Instruction["Init"] = 0] = "Init";
    Instruction[Instruction["Create"] = 1] = "Create";
})(Instruction = exports.Instruction || (exports.Instruction = {}));
function createInitInstruction(systemProgramId, lookupProgramId, payerKey, lookupAccountKey, seeds) {
    var inst_type = Buffer.from(Uint8Array.of(1));
    var data = Buffer.concat(__spreadArray([inst_type], seeds, true));
    console.log(seeds);
    var keys = [
        {
            pubkey: systemProgramId,
            isSigner: false,
            isWritable: false
        },
        {
            pubkey: web3_js_1.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false
        },
        {
            pubkey: payerKey,
            isSigner: true,
            isWritable: true
        },
        {
            pubkey: lookupAccountKey,
            isSigner: false,
            isWritable: true
        },
    ];
    console.log(data.length);
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: lookupProgramId,
        data: data
    });
}
exports.createInitInstruction = createInitInstruction;

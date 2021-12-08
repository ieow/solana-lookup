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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var web3_js_1 = require("@solana/web3.js");
var instruction_1 = require("./instruction");
var elliptic_1 = require("elliptic");
var hash_js_1 = __importDefault(require("hash.js"));
var lib_1 = require("./lib");
var ec = new elliptic_1.ec('secp256k1');
var hashValue = hash_js_1["default"].sha256().update('daddy').digest('hex');
console.log(Uint8Array.from(Buffer.from(hashValue, 'hex')));
var KEY = '9f26ca20d290adfb31255c82eaafb931e5ccb2d3e0ff7891c0b7c012c97d5cb7';
var pkey = ec.keyFromPrivate(KEY, 'hex');
var pubKey = pkey.getPublic(false, 'hex');
console.log(Uint8Array.from(Buffer.from(pubKey, 'hex')));
var signature = pkey.sign(hashValue);
// const lookupProgramId = new PublicKey("CPmEJAGR13X19st1LXHMRbUMiMdh3Xpk7JMwdH264ceB");
var lookupProgramId = new web3_js_1.PublicKey("96sDLTjjYx7Xn2wbCzft5UHHp7Z8j37AQ3rWRphfGeY5");
function main(payer) {
    return __awaiter(this, void 0, void 0, function () {
        var transaction, connection, block, lookupTransaction, mintAddress, secp, seeds, _a, pda, nounce, pdaInfo, inst, depositInstruction;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    transaction = new web3_js_1.Transaction();
                    connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"));
                    return [4 /*yield*/, connection.getRecentBlockhash("max")];
                case 1:
                    block = _b.sent();
                    transaction.recentBlockhash = block.blockhash;
                    transaction.sign(payer);
                    lookupTransaction = new web3_js_1.Transaction({ recentBlockhash: block.blockhash });
                    mintAddress = "GU7eu5XzArRDFJ7WhRnFj1a6TpZ67AYNXMBzamd4hxtY";
                    secp = Buffer.from(pubKey, "hex");
                    console.log(secp.length);
                    seeds = [secp.subarray(0, 32), secp.subarray(32, 64), secp.subarray(64)];
                    console.log("creaetlookup", seeds);
                    return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress(seeds, lookupProgramId)];
                case 2:
                    _a = _b.sent(), pda = _a[0], nounce = _a[1];
                    console.log(pda);
                    console.log(nounce);
                    return [4 /*yield*/, connection.getAccountInfo(pda)];
                case 3:
                    pdaInfo = _b.sent();
                    // console.log(pdaInfo)
                    if (pdaInfo === null) {
                        inst = (0, instruction_1.createInitInstruction)(web3_js_1.SystemProgram.programId, lookupProgramId, payer.publicKey, pda, seeds);
                        lookupTransaction.add(inst);
                    }
                    return [4 /*yield*/, (0, lib_1.deposit)(connection, new web3_js_1.PublicKey(mintAddress), pda, payer.publicKey, 1)];
                case 4:
                    depositInstruction = _b.sent();
                    depositInstruction.forEach(function (inst) {
                        lookupTransaction.add(inst);
                    });
                    // if (lookupInstruction) lookupTransaction.add)
                    // lookupTransaction.sign(pk)
                    // await connection.sendRawTransaction( lookupTransaction.serialize());
                    return [4 /*yield*/, connection.sendTransaction(lookupTransaction, [pk])];
                case 5:
                    // if (lookupInstruction) lookupTransaction.add)
                    // lookupTransaction.sign(pk)
                    // await connection.sendRawTransaction( lookupTransaction.serialize());
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// const key = [65,46,236,110,208,109,47,11,84,189,37,203,15,127,180,41,4,132,208,61,118,105,162,92,204,146,200,110,194,135,56,40,81,30,39,173,213,216,117,11,203,45,95,237,49,168,175,13,141,126,97,67,254,42,181,25,133,92,216,56,120,247,175,64] 
var key = [4, 114, 247, 187, 204, 2, 163, 79, 77, 100, 0, 136, 237, 39, 172, 131, 93, 144, 69, 5, 114, 124, 118, 127, 51, 168, 206, 63, 92, 3, 188, 201, 31, 127, 166, 167, 131, 155, 105, 59, 214, 22, 11, 93, 115, 224, 182, 190, 3, 17, 177, 9, 165, 86, 244, 109, 134, 161, 178, 38, 1, 152, 228, 93];
var pk = web3_js_1.Keypair.fromSecretKey(Buffer.from(key));
console.log(pk.publicKey.toBase58());
main(pk);

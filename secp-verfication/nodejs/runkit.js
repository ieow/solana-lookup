var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var hash = require('hash.js')

let hashValue = hash.sha256().update('daddy').digest('hex')
console.log(Uint8Array.from(Buffer.from(hashValue, 'hex')))

let KEY = '9f26ca20d290adfb31255c82eaafb931e5ccb2d3e0ff7891c0b7c012c97d5cb7'
let pkey = ec.keyFromPrivate(KEY, 'hex')
let pubKey = pkey.getPublic(false, 'hex')
console.log(Uint8Array.from(Buffer.from(pubKey, 'hex')))

let signature = pkey.sign(hashValue)
let recovery = signature.recoveryParam
let der = signature.toDER()
console.log("signature ", recovery, Uint8Array.from(der))

// verification
let verification = pkey.verify(hashValue, signature)
console.log(verification)
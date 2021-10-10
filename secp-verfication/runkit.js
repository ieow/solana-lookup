var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var hash = require('hash.js')

let hashValue = hash.sha256().update('daddy').digest('hex')
console.log(hashValue)

let KEY = '9f26ca20d290adfb31255c82eaafb931e5ccb2d3e0ff7891c0b7c012c97d5cb7'
let pkey = ec.keyFromPrivate(KEY, 'hex')
let pubKey = pkey.getPublic(true, 'hex')
console.log(pubKey)

let signature = pkey.sign(hashValue).toDER()
console.log("signature ", signature)

// verification
let verification = pkey.verify(hashValue, signature)
console.log(verification)
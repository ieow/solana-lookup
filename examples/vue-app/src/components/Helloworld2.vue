<script lang="ts" setup>
import { ref , watch } from "vue";
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from"@solana/web3.js";
    import {ec as EC} from 'elliptic';
    import crypto from 'crypto';
import { createDeposit, redeemSol, redeemSplToken } from "../../../../scripts/src";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const LookupProgramId = "96sDLTjjYx7Xn2wbCzft5UHHp7Z8j37AQ3rWRphfGeY5";

    const ec = new EC('secp256k1');
const verifier = ref("google")
const verifierId= ref("");
const mintAddress = ref("");
const redeemMintAddress = ref("");
const amount = ref(0);

const secp256k1PubKey = ref("");
const solanaKeypair = ref<Keypair>();
const secp256k1KeyPair = ref<EC.KeyPair> ()
const connection = new Connection(clusterApiUrl("devnet"));

const programDerivedAddress = ref("")
const tokens = ref<string[]>([])
  const simpleVerifierMap = () =>{
    let secret = crypto.createHash('sha256').update(`${verifier.value}-${verifierId.value}`).digest('hex');
    secp256k1KeyPair.value = ec.keyFromPrivate(secret);
    return secp256k1KeyPair.value
  }

  const getlookupAccount = async () =>{
    let secp = Buffer.from(secp256k1PubKey.value,"hex");
    // remove first byte 0x04
    if (secp.length === 65) secp = secp.subarray(1)
    const seeds = [secp.subarray(0,32), secp.subarray(32,64)] 
    console.log("lookup seeds",seeds)
    // create a PDA (seed = secp256k1)
    const [pda, nounce]  = await PublicKey.findProgramAddress( seeds, new PublicKey(LookupProgramId) ); 

    console.log("Token Account ")
    const result = await connection.getTokenAccountsByOwner(pda, { 
      programId : TOKEN_PROGRAM_ID
    });

    programDerivedAddress.value = pda.toBase58();
    tokens.value = result.value.map(item=> item.pubkey.toBase58())
    result.value.forEach( item => console.log( item.pubkey.toBase58() ))
    return 
  } 

  const getVerifierPublicKey = async () =>{
    const kp = simpleVerifierMap()
    const pk = await kp.getPublic(false,"hex");
    secp256k1PubKey.value = pk
    debugConsole(pk)
    getlookupAccount()
    return pk

  }
    
  const loadSolanaKeypair = async () =>{
    // const solanaKeypair = Keypair.generate();
    const key = Uint8Array.from(
      [4,114,247,187,204,2,163,79,77,100,0,136,237,39,172,131,93,144,69,5,114,124,118,127,51,168,206,63,92,3,188,201,31,127,166,167,131,155,105,59,214,22,11,93,115,224,182,190,3,17,177,9,165,86,244,109,134,161,178,38,1,152,228,93]
    )

    solanaKeypair.value = Keypair.fromSecretKey(key);

  }
  const deposit = async () =>{
    if (!solanaKeypair.value) throw new Error("Invalid Solana Keypair")

    const secp256k1pubkey = await getVerifierPublicKey();
    const instruction = await createDeposit( 
      connection , 
      secp256k1pubkey.toString(), 
      new PublicKey(LookupProgramId),
      solanaKeypair.value?.publicKey ,
      amount.value, 
      mintAddress.value ? new PublicKey(mintAddress.value) : undefined ); 
    const blockhash = await connection.getRecentBlockhash("max")
    const transaction = new Transaction({recentBlockhash:blockhash.blockhash})
    transaction.add(...instruction)
    transaction.sign(solanaKeypair.value);
    const result = await connection.sendTransaction(transaction, [solanaKeypair.value])
    console.log(result)

    return
  }

  const redeem = async () =>{

    if (!secp256k1KeyPair.value) throw new Error ("Invalid secp256k1 Keypair")
    if (!solanaKeypair.value) throw new Error("Invalid Solana Keypair")
    // signing take place

    const hashValue = crypto.createHash("sha256").update('daddy').digest('hex')
    const signature = secp256k1KeyPair.value.sign(hashValue)

    const blockhash = await connection.getRecentBlockhash("max")
    const transaction = new Transaction({recentBlockhash:blockhash.blockhash})
    if (redeemMintAddress.value) {
      const inst = await redeemSplToken( 
        connection, 
        await secp256k1KeyPair.value.getPublic(false, "hex") , signature, hashValue, new PublicKey(LookupProgramId), new PublicKey(redeemMintAddress.value), solanaKeypair.value.publicKey )
      
      transaction.add (...inst)

    } else {
      const inst = await redeemSol( await secp256k1KeyPair.value.getPublic(false,"hex"),
        signature,
        hashValue,
        new PublicKey(LookupProgramId),
        solanaKeypair.value.publicKey )
      transaction.add(...inst);
    }

    const result = await connection.sendTransaction( transaction, [solanaKeypair.value])
    console.log(result);
    return
  }

  const debugConsole = async (text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector("#console > p")!.innerHTML = typeof text === "object" ? JSON.stringify(text) : text;
  };
</script>
<template>
  <div id="app">
    <p class="font-italic">Note: This is a testing application. Please open console for debugging.</p>
    <div :style="{ marginTop: '20px' }">
        <h4>Blockchain Specific API</h4>
        <div v-if="!secp256k1PubKey">
          <select name="verifer" v-model="verifier" >
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
            <option value="twitch">Twitch</option>
            <option value="reddit">Reddit</option>
            <option value="discord">Discord</option>
          </select> 
          <div>

            <input v-model="verifierId" placeholder="verifierId" />
            <button @click="getVerifierPublicKey">get secp256k1 Pubkey</button>
          </div>
        </div>
        <div v-else>
          <div>
            <div v-if="programDerivedAddress" >
              <div>Program Derived Address</div>
              {{ programDerivedAddress }}
              <div>Token Owned by PDA</div>
              <div v-for="token in tokens" :key="token" >
                {{token}}
              </div>
            </div>

            <button @click="loadSolanaKeypair">Load Solana Key</button>
            <div v-if="solanaKeypair">
              <div>Loaded Solana Public Address</div>
              {{solanaKeypair.publicKey.toBase58()}}
              <div>Token owned</div>

            </div>
          </div> 

          <div>
            <div>
              <input v-model="mintAddress" placeholder="Token Mint Address" />
              <input v-model="amount" type="number" placeholder="Amount" />
            </div>
            <button @click="deposit">Deposit</button>
          </div>

          <div>
            <input v-model="redeemMintAddress" placeholder="Token Mint Address" />
          </div>
          <button @click="redeem">Redeem</button>
        </div>
    </div>
    <div id="console">
      <p></p>
    </div>
  </div>
  <div class="hello"></div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#console {
  border: 1px solid black;
  height: 80px;
  left: 10em;
  padding: 2px;
  bottom: 10px;
  position: absolute;
  text-align: left;
  width: calc(100% - 20px - 10em);
  border-radius: 5px;
  overflow: scroll;
}
#console::before {
  content: "Console :";
  position: absolute;
  top: -20px;
  font-size: 12px;
}
#console > p {
  margin: 0.5em;
  word-wrap: break-word;
}
#font-italic {
  font-style: italic;
}
button {
  margin: 0 10px 10px 0;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

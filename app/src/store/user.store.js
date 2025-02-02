import { defineStore } from "pinia";
import { ref } from "vue";
import * as $enigma from '../libs/enigma';
import { utils, Wallet } from 'ethers';
import { web3Store } from "./web3.store";

export const userStore = defineStore("user", () => {
  const account = ref();

  if (location.origin.includes("loc")) {
    // 0xEc44b418139Fa30bdAe165a7D8484f6d7F471445
    // 0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38
    // 0x242B39E000A1F6B509DAe48965D27eb93464F970

    account.value = {
      "address": "0x30Fde5d947e67cC77e7a0AD1E9F728F53690CCAa",
      "privateKey": "0xf0e48bde0ab972d060ba5eba33939d96bca44896a5f90370ec6b92e7c0b6db09",
      "privateKeyB64": "8OSL3gq5ctBgul66M5OdlrykSJal+QNw7GuS58C22wk=",
      "publicKey": "0x038f1d68ea372dd5dc28e2774e070a485be528f2c349dbe4229f801d3d985106b7",
      "publicKeyB64": "A48daOo3LdXcKOJ3TgcKSFvlKPLDSdvkIp+AHT2YUQa3",
      "metaPublicKey": "0x049adb9f1332a48eeb2382ab5c1c6d2beea1d1c8f2475e62ce1aa0fe3471b8c8f2c859b1dc45218d15ece3cf552d1a694bb9b1e0643cb78803bf4e6a658ae7a1a3",
      "metaPrivateKey": "0x275a35886472f8c74a6c8c7f160e383a61b97d4b6ccd932619d64004b6b14221",
      "rooms": [],
      "contacts": [],
      "displayName": "awdwad",
      "username": "awdawd"
    };
  } 

  if (location.origin.includes("192")) {
  
    account.value = {
      displayName: "RomaA2",
      address: "0x26cA0919489Bb5b2a32e4EEa7d318DC08DFc347a",
      metaPrivateKey: "0xd1738d0e5f4ab8910d404ed510af9a977886344f630561e1ddb9ea1e5fc061ed",
      metaPublicKey: "0x04ce06fda863658256df8a2c9e244ebcebc653bf1a3cfe1b9364f2d037cea08b1c580347fac9aabfe77a25b5a9b94fa3f76255087abc3c1bc8da556febad523dd4",
      privateKey: "0xeb8a7d6a2d611779559c85232ff01582b9efe374c8d5dcddc8c398e56beb56fd",
      privateKeyB64: "64p9ai1hF3lVnIUjL/AVgrnv43TI1dzdyMOY5WvrVv0=",
      publicKey: "0x034f1395fbd0d3b557e8963dcbab1c64874ab2ffd1b3adbe225d9747961a739096",
      publicKeyB64: "A08TlfvQ07VX6JY9y6scZIdKsv/Rs62+Il2XR5Yac5CW",
      constacts: [],
      rooms: []
    };
  }
  if (location.origin.includes("+buck")) {
    account.value = {
      displayName: "RomaA1",
      address: "0x6A4276395a6F148202E374925F840375C548A2c5",
      metaPrivateKey: "0x8cce2cb3537329d2ec722800b55f268f976b1d18656f1b8fc6d19c50133dfa89",
      metaPublicKey: "0x0449ff570fde620e46a11b381b1fff65670f3c11728cc3999f16e8fcec24acf0c3695d4fe60c7cb5f7a396b1352164d35556f956528cb5713531983703d711b6aa",
      privateKey: "0x3fbbc34b89567f87a2db354e300cb87556f1134c7c896d48fcba02d3cb745663",
      privateKeyB64: "P7vDS4lWf4ei2zVOMAy4dVbxE0x8iW1I/LoC08t0VmM=",
      publicKey: "0x02c86c9d010f0005e2646dffe03ab28a06e76076cf95d07596e601c0d268939717",
      publicKeyB64: "AshsnQEPAAXiZG3/4DqyigbnYHbPldB1luYBwNJok5cX",
      constacts: [],
      rooms: []
    };
  }

  const toVaultFormat = (user) => {
    return [
      [ user.displayName, $enigma.combineKeypair(user.privateKeyB64, user.publicKeyB64) ],
      user.rooms,
      user.contacts.reduce((acc, u) => {
        acc[u.publicKey] = { name: u.name };
        return acc;
      }, {})
    ]
  }

  const fromVaultFormat = async (vault) => {
    const keys = $enigma.splitKeypair(vault[0][1])
    const privateKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.privateKey)
    const publicKeyHex = '0x' + $enigma.convertPrivateKeyToHex(keys.publicKey)
    const wallet = new Wallet(privateKeyHex);
    const signature = await wallet.signMessage(privateKeyHex)  
    const meta = await web3Store().bukitupClient.generateKeysFromSignature(signature)

    return {
      displayName: vault[0][0],
      address: wallet.address,
      metaPrivateKey: meta.spendingKeyPair.privatekey,
      metaPublicKey: meta.spendingKeyPair.account.publicKey,
      privateKey: privateKeyHex,
      privateKeyB64: keys.privateKey,
      publicKey: publicKeyHex,
      publicKeyB64: keys.publicKey,
      contacts: Object.entries(vault[2]).map(([publicKey, value]) => ({
          publicKey,
          address: utils.computeAddress('0x' + publicKey).toLowerCase(),
          ...value,
      })),
      rooms: vault[1]
    }    
  }
  
  return {
    account,
    toVaultFormat,
    fromVaultFormat
  };
});

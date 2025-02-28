import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { http, createConfig } from "@wagmi/vue";
import { defineStore } from "pinia";
import { ref } from "vue";
import { getWalletClient } from "@wagmi/core";
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient } from 'viem';
import { BuckItUpClient } from "buckitup-sdk";
import { LIT_ABILITY, LIT_NETWORK } from "@lit-protocol/constants";
import { LitAccessControlConditionResource, createSiweMessage, generateAuthSig } from "@lit-protocol/auth-helpers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { userStore } from "./user.store";

import bcConfig from "../../../bcConfig.json";

export const web3Store = defineStore("web3", () => {
  const projectId = "e90f90e0611a4f5af992b804cb694ff5"; // this is a public projectId only to use on localhost
  const local = {
    id: 225,
    name: "SecretL",
    network: "local225",
    testnet: true,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: ["http://127.0.0.1:31225"] },
      public: { http: ["http://127.0.0.1:31225"] },
    },
    blockExplorers: {
      default: { name: "LocalTrace", url: "https://localtrace.io" },
    },
  };

  const mainChain = IS_PRODUCTION ? sepolia : local; //
  const mainChainId = mainChain.id;
  const blockExplorer = mainChain.blockExplorers.default.url;
  const bc = bcConfig[mainChainId];
  const networks = [sepolia, local];

  const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
  });

  const bukitupClient = new BuckItUpClient();
  const litClient = new LitNodeClient({
    litNetwork: LIT_NETWORK.DatilTest,
  });

  const signTypedData = async (privateKey, data) => {
    const account = privateKeyToAccount(privateKey);        
    const walletClient = createWalletClient({
        chain: mainChain,
        transport: http(),
        account,
    });
    const signature = await walletClient.signTypedData(data)
    return signature
  }

  const getSessionSigs = async (signer, capacityDelegationAuthSig) => {
    try {
      const resourceAbilityRequests = [
        {
          resource: new LitAccessControlConditionResource("*"),
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
      ];

      if (!litClient.ready) {
        await litClient.connect();
      }

      if (!signer) {
        const user = userStore()
        const account = privateKeyToAccount(user.account.privateKey);        
        const wc = createWalletClient({
            chain: mainChain,
            transport: http(),
            account,
        })

        console.log("signer wc", wc);
        signer = {
          address: wc.account.address,
          signMessage: async (toSign) => {                
            return wc.signMessage({
              message: toSign,
            });
          },
        };
      }

      console.log("signer", signer);
      console.log("capacityDelegationAuthSig", capacityDelegationAuthSig);

      const sessionSignatures = await litClient.getSessionSigs({
        chain: "sepolia",
        expiration: new Date(Date.now() + 1000 * 15).toISOString(), // 10 minutes
        capabilityAuthSigs: [ capacityDelegationAuthSig ], // Unnecessary on datil-dev
        resourceAbilityRequests,
        authNeededCallback: async ({
          uri,
          expiration,
          resourceAbilityRequests,
        }) => {
          
          const d = {
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: signer.address,
            nonce: await litClient.getLatestBlockhash(),
            litNodeClient: litClient,
          };
          if (!location.origin.includes("local")) {
            d.domain = location.host;
          }
          console.log("toSign", d);
          const toSign = await createSiweMessage(d);

          return await generateAuthSig({
            address: signer.address,
            signer,
            toSign,
          });
        },
      });
      console.log("sessionSignatures", sessionSignatures);
      return sessionSignatures;
    } catch (error) {
      console.log("sessionSignatures", error);
    }
  };

  const addressShort = (address) => {
    if (address) return address.replace(address.substring(6, 38), '...');
      return '...';
    }
  

  const getAccessControlConditions = (tag, idx) => {
    const checkActionIpfs = 'QmezCK5USTbk2Wfwgk4va8FFZCjeimw1NgX3QCPLTBggsY'
    const checkActionIpfs5 = `
        const read = async (tag, idx, chainId) => {
            try {
                await fetch("https://buckitupss.appdev.pp.ua/api/backup/read?tag=" + tag + "&idx=" + idx + "&chainId=" + chainId);
                console.log('Action success');
            } catch (e) {
                console.log('Action error', e);
            }
            return true    
        };
    `
    
    const conditions =  [
      {
        conditionType: "evmContract",
        contractAddress: bc.vault.address,
        functionName: "granted",
        functionParams: [tag.toString(), idx.toString(), ":userAddress"],
        functionAbi: {
            type: "function",
            name: "granted",
            constant: true,
            stateMutability: "view",
            inputs: [
                {
                    type: "string",
                    name: "tag"
                },
                {
                    type: "uint8",
                    name: "idx"
                },
                {
                    type: "address",
                    name: "stealthAddress"
                }
            ],
            outputs: [
                {
                    type: "bool",
                    name: "result"
                }
            ]
        },
        chain: "sepolia",
        returnValueTest: {
            key: "result",
            comparator: "=",
            value: "true",
        },
      },
      //{ operator: "and" },
      //{
      //  contractAddress: "ipfs://" + checkActionIpfs,
      //  standardContractType: "LitAction",
      //  chain: "sepolia",
      //  method: "read",
      //  parameters: [
      //      tag.toString(),
      //      idx.toString(),
      //      mainChainId
      //  ],
      //  returnValueTest: {
      //      comparator: "=",
      //      value: "true",
      //  },
      //}
    ]
    console.log('conditions', conditions)
    return conditions
  }


 

  return {
    projectId,
    mainChain,
    mainChainId,
    addressShort,
    bukitupClient,
    
    getSessionSigs,
    getAccessControlConditions,
        
    litClient,
    
    bc,
    networks,
    wagmiAdapter,
    
    blockExplorer,
    
    signTypedData
  };
});

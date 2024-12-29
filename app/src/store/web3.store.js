import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { http, createConfig } from "@wagmi/vue";
import { defineStore } from "pinia";
import { ref } from "vue";
import { getWalletClient } from "@wagmi/core";
//import { BuckItUpClient } from "../libs/buckitup";
import { BuckItUpClient } from "buckitup-sdk";
import { LIT_ABILITY, LIT_NETWORK } from "@lit-protocol/constants";
import { LitAccessControlConditionResource, createSiweMessage, generateAuthSig } from "@lit-protocol/auth-helpers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";

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

  const clientConfig = createConfig({
    chains: [sepolia, local],
    transports: {
      [sepolia.id]: http(),
      [local.id]: http(),
    },
  });

  const bukitupClient = new BuckItUpClient();
  const litClient = new LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev,
  });

  const walletClient = async () => {
    return await getWalletClient(wagmiAdapter.wagmiConfig);
  };

  const keyPair = ref();
  const setKeyPair = (val) => {
    keyPair.value = val
  }
  
  const getKeyPair = async (pin) => {
    const signature = await bukitupClient.generateBaseSignature(
      pin.toString(),
      await walletClient()
    );
    keyPair.value = await bukitupClient.generateKeysFromSignature(signature);
  };

  const getSessionSigs = async (signer) => {
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

      const sessionSignatures = await litClient.getSessionSigs({
        chain: "sepolia",
        expiration: new Date(Date.now() + 1000 * 15).toISOString(), // 10 minutes
        //capabilityAuthSigs: [capacityDelegationAuthSig], // Unnecessary on datil-dev
        resourceAbilityRequests,
        authNeededCallback: async ({
          uri,
          expiration,
          resourceAbilityRequests,
        }) => {
          if (!signer) {
            const wc = await walletClient();
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

  const getAccessControlConditions = (tag, idx) => {
    return [{
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
    }]
  }

  const registered = ref(false);
  const setRegisterred = (val) => {
    registered.value = val
  }

  const reset = () => {
    console.log('web3 reset')
    keyPair.value = null
    registered.value = false
  }

  const appKitConfig = {
    adapters: [wagmiAdapter],
    networks,
    projectId,
    
    metadata: {
      name: "Buckitup",
      description: "Buckitup Example",
      url: "https://buckitup.com",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
    features: {
      analytics: false, // Optional - defaults to your Cloud configuration
    },
  };

  return {
    projectId,
    mainChain,
    mainChainId,
    registered,
    setRegisterred,
    bukitupClient,
    getKeyPair,
    getSessionSigs,
    getAccessControlConditions,
    setKeyPair,
    keyPair,
    walletClient,
    litClient,
    appKitConfig,
    bc,
    networks,
    wagmiAdapter,
    clientConfig,
    blockExplorer,
    reset,
  };
});

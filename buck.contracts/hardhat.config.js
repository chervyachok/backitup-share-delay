require('dotenv').config({path:__dirname+'/.env'})
require('@oasisprotocol/sapphire-hardhat');
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");
require('solidity-coverage')

module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      //{ version: "0.8.25", settings: { optimizer: { enabled: true, runs: 5 } } }, 
      //{ version: "0.8.24", settings: { optimizer: { enabled: true, runs: 5 } } }, 
      //{ version: "0.5.16", settings: { optimizer: { enabled: true, runs: 5 } } },    
      { version: "0.8.19", settings: { optimizer: { enabled: true, runs: 5 } } },     
      { version: "0.6.6", settings: { optimizer: { enabled: true, runs: 5 } } }, 
    ],
  },
 
  networks: {
    hardhat: {
      //forking: { url: `https://sapphire.oasis.io` },
      //chainId: 23294,      
      
      //url: "https://rpc.ankr.com/eth",
      //chainId: 1,

      //forking: { url: "https://1rpc.io/sepolia" },
      //chainId: 11155111,
    
      gasPrice: 'auto',
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,      
      loggingEnabled: false, 
      //loggingEnabled: true,      
      accounts: { 
        mnemonic: 'test test test test test test test test test test test junk', 
        accountsBalance: "1000000000000000000000000000",
        count: 20,
      }      
    },
    mainnet: {
      url: "https://rpc.ankr.com/eth",
      chainId: 1,
      gasPrice: 'auto',
      accounts:  [`${process.env.PRIVATE_KEY}`] 
    },       
    sepolia: {
      url: "https://sepolia.infura.io/v3/c683c07028924e35ae07d1b82ecbe342",
      chainId: 11155111,
      gasPrice: 'auto',
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
    local: {
      url: "http://127.0.0.1:31225/",
      chainId: 225,
      gasPrice: 'auto',
      accounts: { 
        mnemonic: 'test test test test test test test test test test test junk', 
        accountsBalance: "1000000000000000000000000000",
        count: 10,
      } 
    },
    vps: {
      url: "https://node227.appdev.pp.ua/",
      chainId: 227,
      gasPrice: 'auto',
      accounts: { 
        mnemonic: 'test test test test test test test test test test test junk', 
        accountsBalance: "1000000000000000000000000000",
        count: 10,
      } 
    },
    
  },
  
  etherscan: {
    apiKey: {
      mainnet: process.env.ETH_API_KEY,
      sepolia: process.env.ETH_API_KEY, 
    },    
  },

  gasReporter: {
    enabled: false,
    enabled: true,
    
  },
};

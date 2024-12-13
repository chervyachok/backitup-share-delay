const { utils } = require("ethers");
const { ethers } = require("hardhat");
const { promises: { readFile, writeFile } } = require("fs");
const path = require('path')
const { time, setBalance } = require("@nomicfoundation/hardhat-network-helpers"); 
// mainnet simulation
// npx hardhat run --network hardhat scripts/deploy.js
// npx hardhat run --network local scripts/deploy.js
// npx hardhat run --network vps scripts/deploy.js
// npx hardhat run --network sepolia scripts/deploy.js

const fileName = 'bcConfig.json'
const filePath = path.join(__dirname, '../../', fileName)
let bcConfig = {}

async function main() {  
    const [ deployer, user1, user2, user3, user4, user5 ] = await ethers.getSigners();	
    
    try { bcConfig = JSON.parse((await readFile(filePath, 'utf-8')))  } catch (error) { console.log('bcConfig', error) } 

    const chainId = Number(await network.provider.send('eth_chainId'));    
    const startBlock = await ethers.provider.getBlockNumber();         
    
    if (!bcConfig[chainId]) bcConfig[chainId] = {}
        	
    console.log("--------------------------------DEPLOY----------------------------------", "CHAIN ID", chainId)
       
    //const BuckitUpRegistry = await ethers.getContractFactory("BuckitUpRegistry");
    //const registry = await BuckitUpRegistry.deploy();
    //await registry.deployed();
    //console.log('BuckitUpRegistry', registry.address)                
    //bcConfig[chainId].registry = {
	//	address: registry.address,
    //    abi: registry.interface.format(),
    //    abijson: registry.interface.format(ethers.utils.FormatTypes.json),
    //    startBlock,
    //}    
    
    const BuckitUpVault = await ethers.getContractFactory("BuckitUpVault");
    const vault = await BuckitUpVault.deploy();
    await vault.deployed();
    console.log('BuckitUpVault', vault.address)    
    bcConfig[chainId].vault = {
		address: vault.address,
        abi: vault.interface.format(),
        abijson: vault.interface.format(ethers.utils.FormatTypes.json),
        startBlock,
    }
    
    await writeFile(`../${fileName}`, JSON.stringify(bcConfig, null, 4));

    return

    const testers = [
        '0x242B39E000A1F6B509DAe48965D27eb93464F970',
        '0xb57624fAB624b4A7A6B46217d56D7faBC4d37f38',
        '0xEc44b418139Fa30bdAe165a7D8484f6d7F471445',
        '0xf7a6799E164685Ef752e7121eC6CBf47D6B67dD5',
        '0xE3D1Ca0e6E87420333c12b475eFcB7457C22E396',
        '0x1df2674903208dfa0590B7664Fa3B25da5009194'
    ]
    for (let tester of testers) {
        await deployer.sendTransaction({ to: tester, value: utils.parseEther('10') }) 
    }

}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });

const wait = function(delay = 500) {
    return new Promise((resolve) =>
        setTimeout(() => {
            resolve();
        }, delay)
    );
}

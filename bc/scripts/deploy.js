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

    bcConfig[chainId].chain = {
        rpcUrl: network.config.url || network.config.forking?.url
    }

    const BuckitUpEventEmitter = await ethers.getContractFactory("EventEmitter");
    const eventEmitter = await BuckitUpEventEmitter.deploy();
    await eventEmitter.deployed();
    console.log('BuckitUpEventEmitter', eventEmitter.address)                
    bcConfig[chainId].eventEmitter = {
		address: eventEmitter.address,
        abi: eventEmitter.interface.format(),
        abijson: eventEmitter.interface.format(ethers.utils.FormatTypes.json),
        startBlock,
    }
       
    const BuckitUpRegistry = await ethers.getContractFactory("Registry");
    const registry = await BuckitUpRegistry.deploy(eventEmitter.address);
    await registry.deployed();
    console.log('BuckitUpRegistry', registry.address)                
    bcConfig[chainId].registry = {
		address: registry.address,
        abi: registry.interface.format(),
        abijson: registry.interface.format(ethers.utils.FormatTypes.json),
    }    
    
    const BuckitUpVault = await ethers.getContractFactory("Vault");
    const vault = await BuckitUpVault.deploy(eventEmitter.address);
    await vault.deployed();
    console.log('BuckitUpVault', vault.address)    
    bcConfig[chainId].vault = {
		address: vault.address,
        abi: vault.interface.format(),
        abijson: vault.interface.format(ethers.utils.FormatTypes.json),
    }
    
    await writeFile(`../${fileName}`, JSON.stringify(bcConfig, null, 4));

    await eventEmitter.setEmitter(registry.address, true)
    await eventEmitter.setEmitter(vault.address, true)

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

    const register = [
        {
            user: deployer,
            ma: '0x04547b7eef905aac23ce49fc5f404fc4b8a7aa0487b5a8d953b9412b90c4910cd9ae7827f4423d3ddc28002b3c90268bc15a494ad078ba620c877aaaf5904be6ae'
        },
        {
            user: user1,
            ma: '0x04a7069e0f966c58bcf3d4478ee3d9873768c50d8c9c00866f8a64c3d9f2a683a5bf4e8af815e8c9c084f950f7d79a1f4ad8e669e08fcb71d72b75a49a0a62eb3b'
        },
        {
            user: user2,
            ma: '0x04d9ae17030e248c745849f144cbfd2da86cf45d46df75a76c5d63db7fcd0eb8e98f7e99bca6abf9b06dfe8fe1bbbd51f58691404ce939bfc778e1a92c3bde9277'
        }          
    ]

    for (let reg of register) {
        const expire = await time.latest() + 300 
        const domain = {
            name: "BuckitUpRegistry",
            version: "1",
            chainId: chainId,
            verifyingContract: registry.address,
        }
        const types = {
            RegisterWithSign: [
                { name: "owner", type: "address" },                   
                { name: "stealthMetaAddress", type: "bytes" },
                { name: "expire", type: "uint40" },
            ],
        }
        const value = {
            owner: reg.user.address,
            stealthMetaAddress: reg.ma,
            expire 
        }
        
        const signature = await reg.user._signTypedData(domain, types, value);

        await registry.connect(deployer).registerWithSign(reg.user.address, reg.ma, expire, signature) 
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

const config = require('../config/config');
const { web3 } = require('.');
const { utils, BigNumber, ethers } = require('ethers');
const { 
	LastBlockMdl, 
	WalletMdl, 
	EventMdl, 	
	BackupMdl,
	ShareMdl,
	NotificationMdl,
	MetaAddressMdl,
	TmLinkMdl,
	DispatchMdl,
	UpdateMdl,
} = require('../models');
const dayjs = require('dayjs');
const axios = require('axios')
const ResetSrv = require("./reset.service");
const NotificationSrv = require("./notification.service");


const start = async function(chainId, delay = 10000) {	
	const eventEmitter = web3.contract('eventEmitter', chainId)

	const lastBlock = await LastBlockMdl.findOne({ chainId, name: 'eventEmitter' })
		if (lastBlock && lastBlock.startBlock != eventEmitter.startBlock ) {
			console.log('---------------------- Contract reset ----------------------')
			await ResetSrv.drop([ ])//'users', 'core_last_block'
		}

	
	const blocksBehind = 10
	const pastBlocksDelay = 300
	const currentBlocksDelay = delay
	const provider = web3.rpc(chainId)
	
	console.log(`EVENTS SCAN STARTED chainId: ${chainId}`, delay)
	const step = 50		
    				
	setTimeout(async function tick() {
        try {		

			const currentBlock = await provider.getBlockNumber()	
								
			let lastBlock = await LastBlockMdl.findOne({ chainId, name: 'eventEmitter' })
			
			if (!lastBlock) {				
				lastBlock = await LastBlockMdl.create({ startBlock: eventEmitter.startBlock, blockNumber: eventEmitter.startBlock, chainId, name: 'eventEmitter' })				
			}
								
			if (lastBlock.blockNumber < currentBlock) {					
				let fromBlock = lastBlock.blockNumber - blocksBehind
				if (fromBlock < 0) fromBlock = 0
				let toBlock = lastBlock.blockNumber + step - 1			
				if (toBlock > currentBlock) {
					toBlock = currentBlock
					delay = currentBlocksDelay					
				} else {
					delay = pastBlocksDelay
				}
				
				const rawEventsUnsorted = await eventEmitter.instance.queryFilter(eventEmitter.instance.filters.Event(), fromBlock, toBlock)	
				const rawEvents = rawEventsUnsorted.sort(function (a, b) { return parseInt(a.blockNumber) - parseInt(b.blockNumber) || parseInt(a.logIndex) - parseInt(b.logIndex) });			
				const events = []		
				
								
				console.log(`SCAN ${chainId} from: ${fromBlock} to: ${toBlock} current: ${currentBlock} left: ${currentBlock - toBlock} events: ${rawEvents.length}`)
				
				let newEvent = false
				for (let ei = 0; ei < rawEvents.length; ei++) {
					const rawEvent = rawEvents[ei];
					const txHash = rawEvent.transactionHash
					const blockNumber = rawEvent.blockNumber
					const logIndex = rawEvent.logIndex
					const blockTimestamp = rawEvent.args.timestamp.toString()
					
					let rawData = rawEvent.args.data
										
					const wallet = rawEvent.args.origin.toLowerCase()
					let isWallet = await WalletMdl.findOne({ address: wallet })		
					if (!isWallet) await WalletMdl.create({ address: wallet })

					const event = {
						chainId,
						action: rawEvent.args.action,
						blockNumber,
						logIndex,						
						blockTimestamp,
						wallet,
						txHash,				
					}					

					if (!newEvent) {
						const isEventAdded = await EventMdl.findOne({ blockNumber: rawEvent.blockNumber, logIndex: rawEvent.logIndex, chainId })
						if (!isEventAdded) newEvent = true
					}
					if (!newEvent) continue

					console.log(`EVENT ${chainId}: ${event.action} `)

					const dispatch = await DispatchMdl.findOne({ chainId, txHash })
					if (dispatch) {
						dispatch.status = 'PROCESSED'	
						await dispatch.save()
					}

					// ------------------------------------------------------------------------------------------
					
					if (event.action === 'Register') {
						const data = utils.defaultAbiCoder.decode(
							[ "address owner", "bytes metaPublicKey" ], 
							rawData
						)
						
						const wallet = data.owner.toLowerCase()
						const metaPublicKey = data.metaPublicKey.toString()

						let isWallet = await WalletMdl.findOne({ address: wallet })
						if (!isWallet) await WalletMdl.create({ address: wallet })
						
													
						await MetaAddressMdl.updateOne({ wallet, chainId }, { $set: { 
							chainId, 
							wallet,
							metaPublicKey,
						}}, { upsert: true });		
						
						global.io.emit('WALLET_UPDATE', wallet)	
																																						
					}

					if (event.action === 'addBackup') {
						const tx =  await provider.getTransaction(txHash);
						const vaultContract = web3.contract('vault', chainId)
						const { tag, backup } = vaultContract.instance.interface.parseTransaction(tx).args					
						const wallet = backup.owner.toLowerCase()
						await UpdateMdl.updateOne({ tag, chainId, txHash, logIndex, blockNumber }, { $set: { 
							chainId,
							blockNumber,
							txHash,
							logIndex,
							tag,
							action: event.action,														
						}}, { upsert: true });		
						
						for (let i = 0; i < backup.shares.length; i++) {
							const share = backup.shares[i];
						   
							const shareRecord = await ShareMdl.findOne({ tag, chainId, idx: i }).select('_id')
							if (!shareRecord) {
								await ShareMdl.create({ 
									chainId,
									tag,
									wallet,
									idx: i,
									disabled: share.disabled,
									stealthAddress: share.stealthAddress,
									messageEncrypted: share.messageEncrypted,
									addressEncrypted: share.addressEncrypted,
									ephemeralPubKey: share.ephemeralPubKey,
									shareEncrypted: share.shareEncrypted,
									shareEncryptedHash: share.shareEncryptedHash,
									delay: share.delay,
									request: share.request,
									unlocked: share.delay == 0
								});	
							}							
						}
						
						const backupRecord = await BackupMdl.findOne({ tag, chainId }).select('_id')
						if (!backupRecord) {
							await BackupMdl.create({ 
								chainId,
								tag,
								wallet,
								disabled: backup.disabled,
								treshold: backup.treshold,
								commentEncrypted: backup.commentEncrypted,
							});	
						}
					}

					if (event.action === 'updateBackupDisabled') {
						const { tag, disabled } = utils.defaultAbiCoder.decode(
							[ "string tag", "uint8 disabled" ], 
							rawData
						)
						
						await UpdateMdl.updateOne({ tag, chainId, txHash, logIndex, blockNumber }, { $set: { 
							chainId,
							blockNumber,
							txHash,
							logIndex,

							tag,
							action: event.action,
							data: 	{
								disabled,
							}							
						}}, { upsert: true });							
					}

					if (event.action === 'updateShareDisabled') {
						const { tag, idx, disabled } = utils.defaultAbiCoder.decode(
							[ "string tag", "uint8 idx", "uint8 disabled" ], 
							rawData
						)
						
						await UpdateMdl.updateOne({ tag, chainId, txHash, logIndex, blockNumber }, { $set: { 
							chainId,
							blockNumber,
							txHash,
							logIndex,

							tag,
							action: event.action,
							data: {								
								idx,
								disabled,
							}							
						}}, { upsert: true });
					}

					if (event.action === 'updateShareDelay') {
						const { tag, idx,	delay } = utils.defaultAbiCoder.decode(
							[ "string tag", "uint8 idx", "uint40 delay" ], 
							rawData
						)
						
						await UpdateMdl.updateOne({ tag, chainId, txHash, logIndex, blockNumber }, { $set: { 
							chainId,
							blockNumber,
							txHash,
							logIndex,

							tag,
							action: event.action,
							data: {								
								idx,
								delay,
							}							
						}}, { upsert: true });
					}

					if (event.action === 'requestRecover') {
						const { tag, idx } = utils.defaultAbiCoder.decode(
							[ "string tag", "uint8 idx" ], 
							rawData
						)
						
						await UpdateMdl.updateOne({ tag, chainId, txHash, logIndex, blockNumber }, { $set: { 
							chainId,
							blockNumber,
							txHash,
							logIndex,

							tag,
							action: event.action,
							data: {								
								idx,
								timestamp: blockTimestamp,
							}							
						}}, { upsert: true });	
					}

					if (dispatch) global.io.emit('WALLET_UPDATE', dispatch.wallet)
																		
					events.push(event)
				}

				if (events.length) {
					await EventMdl.bulkWrite(events.map((e) => { 
						return { updateOne: {
							filter: { 
								chainId,	
								blockNumber: e.blockNumber, 								
								logIndex: e.logIndex,
								action: e.action,								
							},
							update: { $set: e },
							upsert: true
						}}
					}))	
				}				
				lastBlock.blockNumber = toBlock
				await lastBlock.save()
				console.log('SCAN COMPLETED')
			}
			
        } catch (error) {
			console.log(`EVENTS LISTENER ERROR ${chainId}`, error)			
        }
		
      	setTimeout(tick, delay);             
    }, 1000)
}


module.exports = {
	start,
	
};
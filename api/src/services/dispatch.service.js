const { web3 } = require('.');
const { DispatchMdl } = require('../models');
const dayjs = require('dayjs');

const config = require('../config/config');
const { utils, BigNumber, ethers } = require('ethers');


const dispatch = async (input) => {			
	const { wallet, contract, method, methodData, chainId } = input;

	const dispatcher = web3.dispatcher(chainId)

	await web3.contract(contract, chainId).instance.connect(dispatcher).callStatic[method](...methodData.args);	
	//return global.io.emit('WALLET_UPDATE', wallet)	

	const tx = await web3.contract(contract, chainId).instance.connect(dispatcher)[method](...methodData.args)
	
	const dispatch = await DispatchMdl.create({ 
		wallet : wallet.toLowerCase(),
		contract,
		method,         
		chainId,
		methodData,	     
		status: 'PROCESSING',
		txHash: tx.hash  	    
	})
			
	global.io.emit('WALLET_UPDATE', wallet.toLowerCase())	

	return dispatch
}

const startErorsHandler = async function(delay) {
	console.log(`DISPATCH ERRORS HANDLER STARTED`)
	setTimeout(async function tick() {
		try {						
			const dispatchs = await DispatchMdl.find({		
				status: "PROCESSING",
				updatedAt: { $lt: dayjs().subtract(10, 'minutes') }	
				//updatedAt: { $lt: dayjs().subtract(10, 'seconds') }									
			}).populate('wallet')

			if (!dispatchs.length) return setTimeout(tick, delay); 
			console.log('PROCESSING TO LONG FOUND')

			for (let i = 0; i < dispatchs.length; i++) {
				const  dispatch = dispatchs[i];
				dispatch.status = 'ERROR'
				dispatch.errorMsg = 'PROCESSING TO LONG'
				await  dispatch.save()

				global.io.emit('WALLET_UPDATE', dispatch.wallet)
			}
		} catch (error) {
			console.log('PROCESSING LISTENER ERROR', error)			
		}
		setTimeout(tick, delay);             
	}, 2000)
}



module.exports = {
	dispatch,
	startErorsHandler,
};
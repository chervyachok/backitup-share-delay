const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { DispatchSrv } = require("../services");

const { WalletMdl, DispatchMdl } = require("../models");
const pick = require("../utils/pick");
// ------------------------------------------------- UNLIST ------------------------------------------------------

const register = catchAsync(async (req, res) => {
	const { 
		owner,
		metaPublicKey,
		expire,
		signature,
		chainId,
	} = req.body;
	
	const dispatch = await DispatchSrv.dispatch({
		wallet: owner.toLowerCase(),
		contract: 'registry',
		method: 'registerWithSign',
		chainId, 	
		methodData: {
			owner,
			metaPublicKey,
			expire,
			signature,
			args: [
				owner,
				metaPublicKey,
				expire,
				signature,
			]
		},   
	})	
		
	res.send(dispatch)
});

const addBackup = catchAsync(async (req, res) => {
	const { 
		wallet,
		tag,
		backup,
		expire,
		signature,	
		chainId,	
	} = req.body;
	
	
	const dispatch = await DispatchSrv.dispatch({
		wallet: wallet.toLowerCase(),
		contract: 'vault',
		method: 'addBackup', 
		chainId,	
		methodData: {
			tag,
			backup,
			expire,
			signature,
			args: [
				tag,
				backup,
				expire,
				signature,
			]
		},   
	})	
		
	res.send(dispatch)
});

const updateBackupDisabled = catchAsync(async (req, res) => {
	const { 
		wallet,
		tag,
		disabled,		
		expire,
		signature,	
		chainId,
	} = req.body;

	const dispatch = await DispatchSrv.dispatch({
		wallet: wallet.toLowerCase(),
		contract: 'vault',
		method: 'updateBackupDisabled', 
		chainId,	
		methodData: {
			tag,
			disabled,
			expire,
			signature,
			args: [
				tag,
				disabled,				
				expire,
				signature
			]
		},   
	})	

	res.send(dispatch)
});

const updateShareDisabled = catchAsync(async (req, res) => {
	const { 
		wallet,
		tag,
		idx,		
		disabled,				
		expire,
		signature,	
		chainId,
	} = req.body;	

	const dispatch = await DispatchSrv.dispatch({
		wallet: wallet.toLowerCase(),
		contract: 'vault',
		method: 'updateShareDisabled', 
		chainId,	
		methodData: {
			tag,
			idx,
			disabled,			
			expire,
			signature,
			args: [
				tag,
				idx,
				disabled,								
				expire,
				signature
			]
		},   
	})	

	res.send(dispatch)
});

const updateShareDelay = catchAsync(async (req, res) => {
	const { 
		wallet,
		tag,
		idx,
		delay,
		expire,
		signature,	
		chainId,
	} = req.body;
		
	const dispatch = await DispatchSrv.dispatch({
		wallet: wallet.toLowerCase(),
		contract: 'vault',
		method: 'updateShareDelay', 
		chainId,	
		methodData: {
			tag,
			idx,
			delay,
			expire,
			signature,
			args: [
				tag,
				idx,
				delay,				
				expire,
				signature
			]
		},   
	})	
		
	res.send(dispatch)
});

const requestRecover = catchAsync(async (req, res) => {
	const { 
		wallet,
		tag,
		idx,
		expire,
		signature,	
		chainId,	
	} = req.body;
	
	
	const dispatch = await DispatchSrv.dispatch({
		wallet: wallet.toLowerCase(),
		contract: 'vault',
		method: 'requestRecover', 	
		chainId,
		methodData: {
			tag,
			idx,
			expire,
			signature,
			args: [
				tag,
				idx,
				expire,
				signature,
			]
		},   
	})	
		
	res.send(dispatch)
});



const getList = catchAsync(async (req, res) => {
	const { wallet, chainId } = req.query
		
	const filter = { 
		wallet: { $regex: `^${wallet?.toLowerCase()}`, $options: 'i' },		
		chainId
	};
    
	const options = pick(req.query, ["page", "limit", 'sort']);
	options.sortBy = 'createdAt:desc';
		
	const resp = await DispatchMdl.paginate(filter, options);
	
	res.send(resp)
})

module.exports = {
	register,
	addBackup,	
	updateBackupDisabled,
	updateShareDisabled,
	updateShareDelay,
	requestRecover,
	getList,
};

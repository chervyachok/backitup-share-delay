const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { DispatchSrv, BackupSrv } = require("../services");

const { WalletMdl, DispatchMdl, BackupMdl, ShareMdl } = require("../models");
const pick = require("../utils/pick");
const dayjs = require("dayjs");
// ------------------------------------------------- UNLIST ------------------------------------------------------

const getList = catchAsync(async (req, res) => {
	const { wallet, chainId } = req.query
		
	const filter = { 
        chainId,
		wallet: wallet?.toLowerCase(),		
	};
    
	const options = pick(req.query, ["page", "limit", 'sort']);
	options.sortBy = 'createdAt:desc';
		
	const resp = await BackupMdl.paginate(filter, options);

    resp.results = await Promise.all(
		resp.results.map(async (backup) => {
			return BackupSrv.updateBackup(backup)            
        }),
	);
	
	res.send(resp)
})

const getAll = catchAsync(async (req, res) => {
	const { wallet, chainId } = req.query
	
    let resp = [] 
    if (wallet) {
        resp = await BackupMdl.find({ wallet: { $regex: `^${wallet.toLowerCase()}`, $options: 'i' }, chainId }).sort({ _id: -1 });
    } else {
        resp = await BackupMdl.find({ chainId }).sort({ _id: -1 });
    }
	
    resp = await Promise.all(
		resp.map(async (backup) => {
            return await BackupSrv.updateBackup(backup)
        }),
	);
	
	res.send(resp)
})

const get = catchAsync(async (req, res) => {
	const { tag, chainId } = req.query
	
	const backup = await BackupMdl.findOne({ tag, chainId });

	res.send(await BackupSrv.updateBackup(backup))
})

module.exports = {
	getList,
    getAll,
    get
};

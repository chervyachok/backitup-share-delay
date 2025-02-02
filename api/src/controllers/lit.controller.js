const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { DispatchSrv, BackupSrv, LitSrv } = require("../services");

const { WalletMdl, DispatchMdl, BackupMdl, ShareMdl } = require("../models");
const pick = require("../utils/pick");
const dayjs = require("dayjs");

const ethers =  require("ethers");

// ------------------------------------------------- UNLIST ------------------------------------------------------

const getCreditsSign = catchAsync(async (req, res) => {
	const { address } = req.body

    const  litNodeClient = await LitSrv.litNodeClient()

    const { capacityDelegationAuthSig } = await litNodeClient.createCapacityDelegationAuthSig({
        dAppOwnerWallet: LitSrv.litSigner,
        capacityTokenId: '93536',
        delegateeAddresses: [address],
        uses: 1,
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    })
		
	res.send(capacityDelegationAuthSig)
});


module.exports = {
	getCreditsSign,
    
};

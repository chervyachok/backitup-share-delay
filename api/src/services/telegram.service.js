const config = require("../config/config");
const logger = require("../config/logger");
const { AuthMdl, UserMdl, UserBonusesMdl, NotificationMdl, UserSocialMdl, WalletMdl, TmLinkMdl, MetaAddressMdl } = require('../models');
const { Bot, GrammyError, HttpError } = require("grammy");
const NotificationSrv = require("./notification.service");

const web3 = require("./web3.service");
const dayjs = require('dayjs');
const tmBot = new Bot(config.tmToken); 
const $wait = require("../utils/wait");
const { utils } = require("ethers") 

tmBot.use(async (ctx, next) => {
	//ctx.user = await UserMdl.findOne({ telegramSsoUid: ctx.update.message.from.id })	
	ctx.config = {
	  	isDev: ctx.from?.id === config.tmDevId,		
	};	
	await next();
});

tmBot.on('message', async (ctx) => {
	let resp = `Hey ${ctx.from?.first_name}!  \n\nSimply mend me wallet address you want to track to enable/disable notifications \n\n`
	try {
		        		
		let msg = ctx.update.message.text.trim()	
		const uid = ctx.from?.id
		
		if (utils.isAddress(msg)) {
			const wallet = msg.toLowerCase()
			const hasWallet = await WalletMdl.findOne({ address: wallet })

			if (!hasWallet) throw new Error('Wallet not found')

			const meta = await MetaAddressMdl.find({ wallet, metaPublicKey: { $ne: null } })
			if (!meta.length) throw new Error('Wallet not have registered meta address')

			let tmLink = await TmLinkMdl.findOne({ wallet, uid })
			if (!tmLink) {
				tmLink = await TmLinkMdl.create({ wallet, uid })
			} else {
				tmLink.enabled = !tmLink.enabled
				await tmLink.save()
			}
			resp = `Notifications for <b>${web3.addressShort(wallet)}</b> `
			resp += tmLink.enabled ? 'enabled' : 'disabled'			
		}
		

	} catch (error) {
		console.log('Telegram message error', error)
		resp = error.toString()
	}

	ctx.reply(resp, { 
		parse_mode: "HTML",
		disable_web_page_preview: true
	});
    
});

tmBot.command("start", async (ctx) => {
    //const balance = parseFloat(formatEther(BigInt(ctx.user.balance))).toFixed(6) 
    let resp = `Hey ${ctx.from?.first_name}! Welcome \n\n`    
    
    ctx.reply(resp, { 
        parse_mode: "HTML",
        disable_web_page_preview: true
    });
});

tmBot.catch((err) => {
	const ctx = err.ctx;
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;
	if (e instanceof GrammyError) {
	  	console.error("Error in request:", e.description);
	} else if (e instanceof HttpError) {
	  	console.error("Could not contact Telegram:", e);
	} else {
	  	console.error("Unknown error:", e);
	}
});

const start = async function() {	
	logger.info("TM BOT STARTED");		
	tmBot.start()		
    
}

const sendTgMessage = async function(uid, message) {	
	if (uid) {	
		try {	
			await tmBot.api.sendMessage(uid, message, { parse_mode: "HTML", disable_web_page_preview: true });
		} catch (error) {
			console.error('sendTgMessage error', error)
		}
	}		
}

module.exports = {
	start,
	tmBot,
	sendTgMessage
};





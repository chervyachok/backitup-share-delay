const { web3 } = require(".");
const {
	ShareMdl,
	BackupMdl,
	UpdateMdl,
	NotificationMdl,
	TmLinkMdl,
} = require("../models");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);
const config = require("../config/config");

const updateBackup = async (backup) => {
	backup.shares = await ShareMdl.find({
		wallet: backup.wallet,
		tag: backup.tag,
		chainId: backup.chainId,
	}).sort({ idx: 1 });
	return backup;
};

const startUpdateListener = async function (delay) {
	console.log(`BACKUP UPDATE LISTENER STARTED`);
	setTimeout(async function tick() {
		try {
			const updates = await UpdateMdl.find({ processed: false });

			if (!updates.length) return setTimeout(tick, delay);

			for (let i = 0; i < updates.length; i++) {
				const update = updates[i];

				const chainId = update.chainId;
				const tag = update.tag;

				let msg = "";

				console.log(tag, chainId, update);

				const backup = await BackupMdl.findOne({ tag, chainId });
				const wallet = backup?.wallet;

				if (update.action === "addBackup") {
					msg += `🔒 <a href="${web3.explorer(chainId)}/tx/${update.txHash}"><b>${web3.addressShort(wallet)}</b></a> created backup <a href="${config.origin}/recover?t=${tag}"><b>${tag}</b></a>\n`;
				}

				if (update.action === "updateBackupDisabled") {
					backup.disabled = update.data.disabled;
					await backup.save();
					msg += `🔄 <a href="${web3.explorer(chainId)}/tx/${update.txHash}"><b>${web3.addressShort(wallet)}</b></a> <b>${update.data.disabled ? "disabled" : "enabled"}</b> backup <a href="${config.origin}/recover?t=${tag}"><b>${tag}</b></a>\n`;
				}

				if (update.action === "updateShareDisabled") {
					const idx = update.data.idx;
					const share = await ShareMdl.findOne({ tag, chainId, idx });

					share.disabled = update.data.disabled;
					if (share.request > 0) share.request = update.timestamp;
					await share.save();
					msg += `🔄 <a href="${web3.explorer(chainId)}/tx/${update.txHash}"><b>${web3.addressShort(wallet)}</b></a> updated backup <a href="${config.origin}/recover?t=${tag}"><b>${tag}</b></a>\n`;
					msg += `Share <b>#${idx + 1}</b> - <b>${update.data.disabled ? "Disabled" : "Enabled"}</b>\n `;
				}

				if (update.action === "updateShareDelay") {
					const idx = update.data.idx;
					const share = await ShareMdl.findOne({ tag, chainId, idx });
					share.delay = update.data.delay;
					if (share.request > 0) share.request = update.timestamp;
					await share.save();

					msg += `🔄 <a href="${web3.explorer(chainId)}/tx/${update.txHash}"><b>${web3.addressShort(wallet)}</b></a> updated backup <a href="${config.origin}/recover?t=${tag}"><b>${tag}</b></a>\n`;
					msg += `Share <b>#${idx + 1}</b> `;
					if (delay > 0) {
						msg += `recover delay set to <b>${web3.secondsToDuration(update.data.delay)}</b>\n`;
					} else {
						msg += `recover delay <b>removed</b>\n`;
					}
				}

				let stealthAddress;

				if (update.action === "requestRecover") {
					const idx = update.data.idx;
					const share = await ShareMdl.findOne({ tag, chainId, idx });
					share.request = update.timestamp;
					stealthAddress = share.stealthAddress;
					await share.save();

					msg += `🆘 <a href="${web3.explorer(chainId)}/tx/${update.txHash}"><b>${web3.addressShort(wallet)}</b></a> backup share <b>#${idx + 1}</b> recover requested <a href="${config.origin}/recover?t=${tag}"><b>${tag}</b></a>\n`;
				}

				msg = await addBackupDetailsMsg(backup, tag, chainId, msg);

				update.processed = true;
				await update.save();

				const tmRecipients = await TmLinkMdl.find({
					enabled: true,
					wallet,
				}).select("uid");
				await NotificationMdl.bulkWrite(
					tmRecipients.map((e) => {
						return {
							updateOne: {
								filter: {
									type: "telegram",
									uid: `${update.action}-${chainId}-${update.blockNumber}-${update.logIndex}`,
								},
								update: {
									$set: {
										type: "telegram",
										uid: `${update.action}-${chainId}-${update.blockNumber}-${update.logIndex}`,
										recipient: e.uid,
										msg,
									},
								},
								upsert: true,
							},
						};
					}),
				);

				global.io.emit("WALLET_UPDATE", wallet);
				global.io.emit("BACKUP_UPDATE", {
					wallet,
					action: update.action,
					backup: await updateBackup(backup),
					stealthAddress,
				});
			}
		} catch (error) {
			console.log("BACKUP UPDATE LISTENER ERROR", error);
		}

		setTimeout(tick, delay);
	}, 2000);
};

const startUnlockListener = async function (delay) {
	console.log(`BACKUP UNLOCK LISTENER STARTED`);
	setTimeout(async function tick() {
		try {
			const shares = await ShareMdl.find({
				unlocked: false,
				request: { $ne: 0 },
			});
			for (let index = 0; index < shares.length; index++) {
				const share = shares[index];
				const { tag, chainId } = share;
				const backup = await BackupMdl.findOne({ tag, chainId });

				if (
					!backup.disabled &&
					!share.disabled &&
					share.delay &&
					share.request &&
					dayjs().unix() >= share.request + share.delay
				) {
					const wallet = backup.wallet;

					let msg = `🟢 <a href="${web3.explorer(share.chainId)}/address/${wallet}"><b>${web3.addressShort(wallet)}</b></a> backup <a href="${config.origin}/recover?t=${tag}"><b>${tag}</b></a> share <b>#${share.idx + 1}</b> unlocked \n`;
					msg = await addBackupDetailsMsg(backup, tag, chainId, msg);

					const tmRecipients = await TmLinkMdl.find({
						enabled: true,
						wallet,
					}).select("uid");
					await NotificationMdl.bulkWrite(
						tmRecipients.map((e) => {
							return {
								updateOne: {
									filter: {
										type: "telegram",
										uid: `shareUnlocked-${chainId}-${share.tag}-${share.idx}`,
									},
									update: {
										$set: {
											type: "telegram",
											uid: `shareUnlocked-${chainId}-${share.tag}-${share.idx}`,
											recipient: e.uid,
											msg,
										},
									},
									upsert: true,
								},
							};
						}),
					);

					share.unlocked = true;
					await share.save();

					global.io.emit("BACKUP_UPDATE", {
						backup: await updateBackup(backup),
						wallet,
						action: "shareUnlocked",
						shareIdx: index,
					});
				}
			}
		} catch (error) {
			console.log("BACKUP UNLOCK LISTENER ERROR", error);
		}
		setTimeout(tick, delay);
	}, 2000);
};

const addBackupDetailsMsg = async (backup, tag, chainId, msg) => {
	msg += `Recover treshold <b>${backup.treshold}</b>\n`;
	const shares = await ShareMdl.find({ tag, chainId });
	for (let i = 0; i < shares.length; i++) {
		const share = shares[i];
		msg += `-----------------------------------\n`;
		msg += `Share <b>#${share.idx + 1}</b> `;

		if (share.unlocked) {
			msg += `unlocked \n`;
		} else {
			if (share.delay) {
				if (share.request) {
					const unlocks = dayjs.unix(share.request + share.delay);
					if (unlocks > dayjs()) {
						msg += `${unlocks > dayjs() ? "unlocks" : "unlocked"} <b>${dayjs().to(unlocks)} (${unlocks.format("DD-MM HH:mm:ss")}) </b>\n`;
					} else {
						msg += `unlocked \n`;
					}
					msg += `<b>Unlock requested (${dayjs.unix(share.request).format("DD-MM HH:mm:ss")})</b>\n`;
				} else {
					msg += `recover delay <b>${web3.secondsToDuration(share.delay)}</b>\n`;
				}
			}
		}
		if (share.disabled) {
			msg += `<b>Reading disabled</b>\n`;
		}
	}
	return msg;
};

module.exports = {
	updateBackup,
	startUpdateListener,
	startUnlockListener,
};

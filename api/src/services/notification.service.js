const dayjs = require('dayjs');
const { NotificationMdl, ShareMdl, BackupMdl } = require('../models');
const { sendTgMessage } = require('./telegram.service');
const web3 = require('./web3.service');

const start = async function(delay) {	
	console.log(`NOTIFICATIONS LISTENER STARTED`)
	setTimeout(async function tick() {
        const notifications = await NotificationMdl.find({ emited: { $eq: false } }).limit(2)        
		if (!notifications.length) return setTimeout(tick, delay)
        
        const notification = notifications[0]
console.log('notification', notification)
        if (notification.msg) {
            sendTgMessage(notification.recipient, notification.msg)
        }        
        
        notification.emited = true
        await notification.save()

        if (notifications.length > 1) {
            return setTimeout(tick, 50); 
        }
                
      	setTimeout(tick, delay);             
    }, 2000) 
}

const notify = async function(data) {	
    data.timestamp = dayjs().unix()
    if (data.uid) {
        const filter = { user: data.user, uid: data.uid }
		const $set = data	
		await NotificationMdl.updateOne(filter, { $set }, { upsert: true })
    } else {
        await NotificationMdl.create(data)
    }	
}

module.exports = {
	start,	
    notify
};
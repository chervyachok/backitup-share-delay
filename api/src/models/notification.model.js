const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const notification = mongoose.Schema(
  {
    type: { type: String, index: true, required: true },   
    uid: { type: String, index: true, required: true },    
    recipient: { type: String, required: true },     
    emited: { type: Boolean, default: false, index: true },  
    msg: { type: String }, 
    data: {},
  },
  {
		timestamps: true,	
    includeCreatedAt: true,	
    collection: 'notification'
	}
);

// add plugin that converts mongoose to json
notification.plugin(toJSON);
notification.plugin(paginate);

const Notification = mongoose.model('Notification', notification);

module.exports = { Notification, notification };

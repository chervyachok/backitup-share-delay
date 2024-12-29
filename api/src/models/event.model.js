const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const eventsSchema = mongoose.Schema(
  {   
    chainId: { type: String, index: true, required: true },        
    wallet: { type: String, required: true, index: true },	
    action: { type: String, required: true, index: true }, 
    blockNumber: { type: Number, default: 0, index: true },
    blockTimestamp: { type: Number, default: 0, index: true },
    logIndex: { type: Number, default: 0, index: true },     
    rawEvent: { type: Object, private: true }, 
    txHash: { type: String, required: true, index: true },  
    data: {},  
  },
  {
		timestamps: true,	
    includeUpdatedAt: true,
        includeCreatedAt: true,
    collection: 'event'
	}
);

// add plugin that converts mongoose to json
eventsSchema.plugin(toJSON);
eventsSchema.plugin(paginate);

const Event = mongoose.model('Event', eventsSchema);

module.exports = { Event, eventsSchema };

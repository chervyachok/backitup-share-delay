const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const dispatchSchema = mongoose.Schema(
  {
    wallet: { type: String, required: true, index: true }, 

    chainId: { type: Number, required: true, index: true },
    contract: { type: String, required: true, index: true },  
    method: { type: String, required: true, index: true },         
    
    methodData: {},    
    
    data: {}, 
              
    tx: { type: Object, private: true },
    txData: { type: Object, private: true },        
    status: { type: String, default: 'NONE', index: true },    
    txHash: { type: String, index: true },
    errorMsg: { type: String },
  },
  {
		timestamps: true,	
    includeUpdatedAt: true,
        includeCreatedAt: true,
    collection: 'dispatch'
	}
);

// add plugin that converts mongoose to json
dispatchSchema.plugin(toJSON);
dispatchSchema.plugin(paginate);

const Dispatch = mongoose.model('Dispatch', dispatchSchema);

module.exports = { Dispatch, dispatchSchema };

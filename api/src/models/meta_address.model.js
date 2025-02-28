const mongoose = require("mongoose");
const { toJSON, paginate, load } = require("./plugins");

const metaAddressSchema = mongoose.Schema(
	{
        chainId: { type: String, index: true, required: true },
        wallet: { type: String, required: true, index: true },  		
        metaPublicKey: { type: String, index: true, default: null }   		     
    },
	{
		timestamps: true,	
        includeUpdatedAt: true,
        includeCreatedAt: true,
        collection: 'meta_address'
	}
);

metaAddressSchema.plugin(toJSON);
metaAddressSchema.plugin(paginate);
metaAddressSchema.plugin(load);

const MetaAddress = mongoose.model("MetaAddress", metaAddressSchema);
module.exports = { MetaAddress, metaAddressSchema };
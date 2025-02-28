const mongoose = require("mongoose");
const { toJSON, paginate, load } = require("./plugins");

const shareSchema = mongoose.Schema(
	{
        chainId: { type: String, index: true, required: true },  
         
        wallet: { type: String, required: true, index: true }, 
        tag: { type: String, required: true, index: true }, 
        idx: { type: Number, required: true },
		disabled: { type: Number, default: 0 },
        stealthAddress: { type: String, required: true },	    
        messageEncrypted: { type: String, required: true },   
        addressEncrypted: { type: String, required: true },    
        ephemeralPubKey: { type: String, required: true },	
        shareEncrypted: { type: String, required: true },	
        shareEncryptedHash: { type: String, required: true },	
        delay: { type: Number, required: true },	
        request: { type: Number, required: true },	
        unlocked: { type: Boolean, default: false },	
    },
	{
		timestamps: true,
        includeUpdatedAt: true,
        includeCreatedAt: true,
        collection: 'share'
	}
);

shareSchema.plugin(toJSON);
shareSchema.plugin(paginate);

const Share = mongoose.model("Share", shareSchema);
module.exports = { Share, shareSchema };
const mongoose = require("mongoose");
const { toJSON, paginate, load } = require("./plugins");

const restoreRequestSchema = mongoose.Schema(
	{
        chainId: { type: String, index: true, required: true },   
        wallet: { type: String, required: true, index: true }, 
        backup: { type: mongoose.SchemaTypes.ObjectId, ref: 'Backup', required: true, index: true },
		tag: { type: String, index: true, required: true },	
        idx: { type: Number, required: true },
        timestamp: { type: Number, required: true },
        
    },
	{
		timestamps: true,	
        includeUpdatedAt: true,
        includeCreatedAt: true,
        collection: 'restore_request'
	}
);

restoreRequestSchema.plugin(toJSON);
restoreRequestSchema.plugin(paginate);

const RestoreRequest = mongoose.model("RestoreRequest", restoreRequestSchema);
module.exports = { RestoreRequest, restoreRequestSchema };
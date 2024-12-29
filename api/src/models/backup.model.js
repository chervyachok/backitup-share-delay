const mongoose = require("mongoose");
const { toJSON, paginate, load } = require("./plugins");

const backupSchema = mongoose.Schema(
	{
        chainId: { type: String, index: true, required: true },   
        wallet: { type: String, required: true, index: true }, 
		tag: { type: String, index: true, required: true },	
        disabled: { type: Number, default: 0 },
        treshold: { type: Number, required: true },
        commentEncrypted: { type: String, required: true },   
        shares: []
    },
	{
		timestamps: true,	
        includeUpdatedAt: true,
        includeCreatedAt: true,
        collection: 'backup'
	}
);

backupSchema.plugin(toJSON);
backupSchema.plugin(paginate);

const Backup = mongoose.model("Backup", backupSchema);
module.exports = { Backup, backupSchema };
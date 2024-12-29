const mongoose = require("mongoose");
const { toJSON, paginate, load } = require("./plugins");

const walletSchema = mongoose.Schema(
	{
		address: { type: String, index: true, set: (v) => (v ? v.toLowerCase() : v) },	//required: true, 
	},
	{
		timestamps: true,
		includeCreatedAt: true,
        collection: 'wallet'
	}
);

walletSchema.plugin(toJSON);
walletSchema.plugin(paginate);
walletSchema.plugin(load);

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = { Wallet, walletSchema };
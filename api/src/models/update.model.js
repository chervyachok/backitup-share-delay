const mongoose = require("mongoose");
const { toJSON, paginate, load } = require("./plugins");

const updateSchema = mongoose.Schema(
	{
		chainId: { type: String, index: true, required: true },
		txHash: { type: String, required: true, index: true },
		blockNumber: { type: Number, required: true, index: true },
		logIndex: { type: Number, required: true, index: true },
		action: { type: String, index: true, required: true },
		tag: { type: String, index: true, required: true },
		data: {},
		timestamp: { type: Number },
		processed: { type: Boolean, default: false },
	},
	{
		timestamps: true,
		includeCreatedAt: true,
		collection: "update",
	},
);

updateSchema.plugin(toJSON);
updateSchema.plugin(paginate);

const Update = mongoose.model("Update", updateSchema);
module.exports = { Update, updateSchema };

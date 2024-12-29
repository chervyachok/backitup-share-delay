const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const blockSchema = mongoose.Schema(
	{
		chainId: { type: String, required: true },
        blockNumber: { type: Number, required: true },	
		startBlock: { type: Number, required: true },
		name: { type: String },
		
	},
	{
		timestamps: true,
		includeUpdatedAt: true,
        includeCreatedAt: true,
		collection: 'last_block'
	}
);

// add plugin that converts mongoose to json
blockSchema.plugin(toJSON);

const LastBlock = mongoose.model("LastBlock", blockSchema);

module.exports = { LastBlock, blockSchema };

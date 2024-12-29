const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const tmLinkSchema = mongoose.Schema(
	{
		wallet: { type: String, required: true, index: true },
		uid: { type: String, required: true },
		enabled: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		collection: 'tm_link'
	}
);

// add plugin that converts mongoose to json
tmLinkSchema.plugin(toJSON);

const TmLink = mongoose.model("TmLink", tmLinkSchema);
module.exports = { TmLink, tmLinkSchema };

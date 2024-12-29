const catchAsync = require("../utils/catchAsync");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { NotificationMdl } = require("../models");
const pick = require("../utils/pick");

const config = require("../config/config");
const { BigNumber, utils, ethers } = require("ethers");

const get = catchAsync(async (req, res) => {
	const wallet = req.user
	const filter = { user };
    
	const options = pick(req.query, ["page", "limit", 'sort']);
	
	switch (req.query.sort) {
		case 'asc':
			options.sortBy = 'createdAt:asc';
			break;
		case 'desc':
			options.sortBy = 'createdAt:desc';
			break;		
	}
	
	const resp = await NotificationMdl.paginate(filter, options);
	
	res.send(resp)
})

module.exports = {
	get,
	
}
const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const verifyCallback = (req, resolve, reject, data) => async (err, user, info) => {
	
	//if (err || info) {
	//	return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication error'));
	//}

	if ((err || info|| !user )&& !data?.allowNotAuthentificated) {
		return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
	}
	req.user = user;

	//if (requiredRights.length) {
	//	const userRights = roleRights.get(user.role);
	//	const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
	//	if (!hasRequiredRights && req.params.userId !== user.id) {
	//		return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
	//	}
	//}
	resolve();
};

const auth = (data) => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, data))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

module.exports = auth;
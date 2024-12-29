const Joi = require('joi');

const loginChallenge = {
  body: Joi.object().keys({
    address: Joi.string().required(),
  }),
};

const loginEth = {
  body: Joi.object().keys({
    uid: Joi.string().required(),
    signature: Joi.string().required(),
  }),
};

const linkEth = {
  body: Joi.object().keys({
    uid: Joi.string().required(),
    signature: Joi.string().required(),
    ssoUid: Joi.string().required(),
  }),
};

const loginSso = {
  body: Joi.object().keys({
    uid: Joi.string().required(),
    signature: Joi.string().required(),
    accessToken: Joi.string().required(),
  }),
};

const checkSso = {
  body: Joi.object().keys({
    address: Joi.string(),
    accessToken: Joi.string().required(),
  }),
};



const linkFirebase = {
  body: Joi.object().keys({
    accessToken: Joi.string().required(),
  }),
};

module.exports = {
  loginChallenge,
  loginEth,
  checkSso,
  loginSso,
  linkEth,
  linkFirebase
};

const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");
const bcConfig = require('../../../bcConfig.json');
console.log('MODE', process.env.MODE)
if (process.env.MODE) {
	dotenv.config({ path: path.join(__dirname, `../../.env${process.env.MODE ? '.' + process.env.MODE : ''}`) })
} else {
	dotenv.config({ path: path.join(__dirname, `../../.env`) })
}


const envVarsSchema = Joi.object()
	.keys({
		NODE_ENV: Joi.string().valid("production", "development", "test").required(),
		
		PORT: Joi.number().default(3000),
		MONGODB_URL: Joi.string().required().description("Mongo DB url"),
		
		INDEXED_CHAINS: Joi.string(),
		ORIGIN: Joi.string().required().description("Origin"), 

		DISPATCHER_PK: Joi.string().required().description("Dispatcher pk"), 
					
		TM_TOKEN: Joi.string().required().description("Telegram token"),
		TM_DEVELOPER_ID: Joi.string().required().description("Telegram developer id"),
		
		JWT_SECRET: Joi.string().required().description('JWT secret key'),
		JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
		JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(7).description('days after which refresh tokens expire'),
	})
	.unknown();

const { value: envVars, error } = envVarsSchema
	.prefs({ errors: { label: "key" } })
	.validate(process.env);

if (error) throw new Error(`Config validation error: ${error.message}`);

module.exports = {
	
	env: envVars.NODE_ENV,
	port: envVars.PORT,

	bcConfig,
			
	INDEXED_CHAINS: envVars.INDEXED_CHAINS ? envVars.INDEXED_CHAINS.trim().split(',').map(c => { 
		let a = c.split(':')
		return { id: a[0], delay: a[1] } 
	}) : [],

	DISPATCHER_PK: envVars.DISPATCHER_PK,
	

	tmDevId: envVars.TM_DEVELOPER_ID,
	tmToken: envVars.TM_TOKEN,

	origin: envVars.ORIGIN,
			
	mongoose: {
		url: envVars.MONGODB_URL + (envVars.NODE_ENV === "test" ? "-test" : ""),
		options: {
			//useCreateIndex: true,
			//useNewUrlParser: true,
			//useUnifiedTopology: true,
		},
	},
	
	jwt: {
		secret: envVars.JWT_SECRET,
		accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,    
		refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,  
	},

	admins: [
		'0x242B39E000A1F6B509DAe48965D27eb93464F970', // roma
    ],

	
};

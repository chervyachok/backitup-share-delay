const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const { Server } = require("socket.io");

const {
	IndexerSrv,
	NotificationSrv,
	DispatchSrv,
	BackupSrv,
} = require("./services");
const TmBot = require("./services/telegram.service");

let server;
//mongoose.set("strictQuery", true);
mongoose
	.connect(config.mongoose.url, config.mongoose.options)
	.then(async () => {
		logger.info("Connected to MongoDB");

		server = app.listen(config.port, async () => {
			logger.info(`Listening to port ${config.port}`);

			if (config.INDEXED_CHAINS.length) {
				logger.info(
					`INDEXED_CHAINS: ${config.INDEXED_CHAINS.map((c) => c.id).join(" ")}`,
				);

				if (config.INDEXED_CHAINS.length) {
					for (const chain of config.INDEXED_CHAINS) {
						IndexerSrv.start(
							chain.id,
							parseInt(chain.delay) * 1000,
						);
					}
					NotificationSrv.start(5000);
					//TmBot.start();
				}
				BackupSrv.startUpdateListener(1000);
				BackupSrv.startUnlockListener(1000);
				DispatchSrv.startErorsHandler(3000);
			}
		});

		const io = new Server({
			path: "/api/socket.io/",
			cors: {
				origin: "*",
				//origin: [
				//	"https://fanatico.appdev.pp.ua",
				//	"http://localhost:5200",
				//	"http://127.0.0.1:5200",
				//	'http://192.168.100.28:5200',
				//	"http://localhost:3000",
				//	"https://fco-landing.vercel.app",
				//	"https://fanatico.virtulos.net",
				//	"https://secret.fanatico.com/",
				//	"https://secret-token.com",
				//],
				methods: ["GET", "POST"],
				allowEIO3: true,
				//credentials: true,
			},
		});
		io.on("connection", () => {
			logger.info("SOCKET connection received");
		});
		io.listen(server);
		global.io = io;
	});

const exitHandler = () => {
	if (server) {
		server.close(() => {
			logger.info("Server closed !");
			process.exit(1);
		});
	} else {
		process.exit(1);
	}
};

const unexpectedErrorHandler = (error) => {
	logger.error(error);
	exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
	logger.info("SIGTERM received");
	if (server) {
		server.close();
	}
});

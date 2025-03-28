const { SignalServerRunner, runTestSignalServer } = require('@dxos/signal');

const PORT = process.env.PORT || 5001; // Default port 5001, change if needed

(async () => {
	try {
		await runTestSignalServer({ port: 3951, killExisting: true });
		//const signalServer = new SignalServerRunner({
		//	binCommand: 'node', // Set the binary command
		//	signalArguments: ['server'], // Arguments for DXOS signaling
		//	port: PORT,
		//	killExisting: true, // Kill existing process on the same port
		//});
		//await signalServer.startProcess();
		//await signalServer.waitUntilStarted();
		console.log(`✅ DXOS Signaling Server running at ws://localhost:${PORT}`);
	} catch (error) {
		console.error('❌ Failed to start DXOS Signaling Server:', error);
		process.exit(1);
	}
})();

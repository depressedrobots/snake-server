/*
 * Snake AI testbench. 
 * Copyright 2014 W.A.Jurczyk (wajurczyk@gmail.com)
 *
 * USAGE: node server.js [MILLISECONDS_BETWEEN_UPDATES] [PORT]
 * Pass -1 for milliseconds to deactivate ticks. 
 */

/*
 * check command line argument
 */
var USAGE_STRING = "USAGE: node server.js [-1|MILLISECONDS_BETWEEN_UPDATES] [PORT(optional)]\n\n";

/*
 * tick duration argument
 */
var tickDuration = -1;		// default value is -1, so ticks will be deactivated.
if( process.argv.length >= 3 ) {
	tickDuration = parseInt(process.argv[2], 10);
}

if( isNaN(tickDuration) ) {
	/*
	 * unable to parse milliseconds argument
	 */
	console.log("\nERROR: Could not parse " + process.argv[2] + "\n" + USAGE_STRING);
	process.exit(1);
}

/*
 * check custom port argument
 */
var port = 1337;
if( process.argv.length >= 4 ) {
	port = parseInt(process.argv[3]);
	if( isNaN(port)  ){
		console.log("\nERROR: Could not parse port argument '" + process.argv[3] + "'." + USAGE_STRING);
		process.exit(1);
	}
}

/*
 * the dimensions of the grid
 */
var GRID_SIZE_X = 10;
var GRID_SIZE_Y = 10;

/*
 * start the server
 */
console.log("\nStarting SNAKE AI SERVER on port " + port + " with " + tickDuration + "ms per tick...\n\n");
 
var io = require("socket.io");
var server = io.listen(port).set("log level", 1);

server.sockets.on("connection", function(socket) {
	console.log("new client");

	socket.on("msg", function(data){
		server.sockets.emit("broadcast", "serverMSG");
		//socket.emit("msg", "serverMSG");
		console.log("incoming msg: " + JSON.stringify(data)); 
	});
});

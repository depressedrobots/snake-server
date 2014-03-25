/*
 * Snake AI testbench. 
 * Copyright 2014 W.A.Jurczyk (wajurczyk@gmail.com)
 *
 * USAGE: node server.js {MILLISECONDS_BETWEEN_UPDATES}
 */

/*
 * check command line argument
 */
if( process.argv.length < 3 || process.argv.length > 4 ) {
	/*
	 * four arguments expected, first two in array are path and filename, third and fourth are actual arguments
	 */
	console.log("\nERROR: Argument expected.\nUSAGE: node server.js {MILLISECONDS_BETWEEN_UPDATES} [PORT(optional)]\n\n");
	process.exit(1); 
}

var tickDuration = parseInt(process.argv[2], 10);
if( isNaN(tickDuration) ) {
	/*
	 * unable to parse milliseconds argument
	 */
	console.log("\nERROR: Could not parse " + process.argv[2] + "\nUSAGE: node server.js {MILLISECONDS_BETWEEN_UPDATES}\n\n");
	process.exit(1);
}

var port = 1337;
if( process.argv.length == 4 ) {
	port = parseInt(process.argv[3]);
	if( isNaN(port)  ){
		console.log("\nERROR: Could not parse port argument '" + process.argv[3] + "'.\n\n");
		process.exit(1);
	}
}

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

var io = require("socket.io");
var server = io.listen(1337).set("log level", 1);

server.sockets.on("connection", function(socket) {
	console.log("new client");

	socket.on("msg", function(data){
		server.sockets.emit("broadcast", "serverMSG");
		//socket.emit("msg", "serverMSG");
		console.log("incoming msg: " + JSON.stringify(data)); 
	});
});

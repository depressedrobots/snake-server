var io = require('socket.io-client'),
socket = io.connect('localhost', {
	    port: 1337
});
socket.on('connect', function () { 
	console.log("socket connected");
	socket.emit('msg', { user: 'me', msg: 'whazzzup?' });
});
socket.on("broadcast", function(data) {
	console.log("received broadcast. echoing..");
	socket.emit("msg", {data: "echo"});
});

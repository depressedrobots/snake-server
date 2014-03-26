snake-server
============

A node.js socket server to test-drive snake AIs


Installation
------------

<pre><code>npm install
</code></pre>


Run
---

<pre><code>node server.js
</code></pre>
then browse to http://localhost:8080


Example Client (JS)
-------------------

<pre><code>
/*
 * connect to local server
 */
var socket = io.connect('localhost', {port: 1337});

/*
 * handle connect event
 */
socket.on('connect', function () { 
  console.log("socket connected");
  socket.emit('start', null);         // request game start
});

/*
 * handle game state update from server
 */
socket.on("update", function(data) {
		console.log("received update: " + JSON.stringify(data, undefined, 2));
		
		/*
		compute smart move
		*/
		
		// direction: 0 = up, 1 = right, 2 = down, 3 = left
		socket.emit("turn", {direction: 1});  // turn right
});


</code></pre>

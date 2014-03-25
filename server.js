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
var _tickDuration = -1;		// default value is -1, so ticks will be deactivated.
if( process.argv.length >= 3 ) {
	_tickDuration = parseInt(process.argv[2], 10);
}

if( isNaN(_tickDuration) ) {
	/*
	 * unable to parse milliseconds argument
	 */
	console.log("\nERROR: Could not parse " + process.argv[2] + "\n" + USAGE_STRING);
	process.exit(1);
}

/*
 * check custom port argument
 */
var _port = 1337;
if( process.argv.length >= 4 ) {
	_port = parseInt(process.argv[3]);
	if( isNaN(_port)  ){
		console.log("\nERROR: Could not parse port argument '" + process.argv[3] + "'." + USAGE_STRING);
		process.exit(1);
	}
}

/*
 * the dimensions of the grid
 */
var GRID_SIZE_X = 10;
var GRID_SIZE_Y = 10;

/**
 * a snake object. see resetGame() for properties.
 */
var _snake = null;

/**
 * the playfield. a two-dimensional array of integers.
 * 0 = empty
 * 1 = head of snake
 * 2 = body segment of snake
 * 3 = apple
 */
var _grid = null;

/*
 * start the server
 */
console.log("\nStarting SNAKE AI SERVER on port " + _port + " with " + _tickDuration + "ms per tick...\n\n");
 
var _io = require("socket.io");
var _server = _io.listen(_port).set("log level", 1);

_server.sockets.on("connection", function(socket) {
	console.log("new client");

	socket.on("msg", function(data){
		_server.sockets.emit("broadcast", "serverMSG");
		//socket.emit("msg", "serverMSG");
		console.log("incoming msg: " + JSON.stringify(data)); 
	});

	socket.on("start", function(data) {
		console.log("received command: start");
		startGame(socket);
		socket.emit("game started", null);
		_server.sockets.emit("update", getUpdateObject());
	});

	socket.on("requestUpdate", function(data) {
		console.log("received command: requestUpdate");
		socket.emit("update", getUpdateObject());
	});
});

var startGame = function(socket) {
	resetGame();
}

/**
 * resets the grid and sets new random starting position for the snake and an apple
 */
var resetGame = function() {
	resetGrid();
	resetWorm();
	spawnApple();
	updateGrid();
}

/**
 * set all grid indices to zero
 */
var resetGrid = function() {
	_grid = [];
	for( var x = 0; x < GRID_SIZE_X; ++x ) {
		_grid.push(new Array());	// add new array for every row
		for( var y = 0; y < GRID_SIZE_Y; ++y ) {
				_grid[x].push(0);
		}
	}
}

/**
 * create a new worm object with a random positon and random direction
 */
var resetWorm = function() {
	/*
	 * get a random direction
	 */
	var directionIndex = Math.floor(Math.random() * 4);

	_worm = {
		direction: directionIndex,
		segments: [getRandomFreePosition()]
	};
	
	console.log("resetting worm to: " + JSON.stringify(_worm));
}

/**
 * look for a free spot on the grid and put an apple there
 */
var spawnApple = function() {
	var applePos = getRandomFreePosition();
	_grid[applePos.x][applePos.y] = 3;
}

/**
 * synchronize grid and worm object
 */
var updateGrid = function() {
	/*
	 * first, save the apple position
	 */
	var applePos = {x: -1, y: -1};
	var appleFound = false;
	for( var x = 0; x < GRID_SIZE_X; ++x ) {
		for( var y = 0; y < GRID_SIZE_Y; ++y ) {
			if( _grid[x][y] == 3 ) {
				applePos.x = x;
				applePos.y = y;
				appleFound = true;
				break;
			}
		}
		if( true == appleFound ) {
			break;
		}
	}

	/*
	 * reset the whole grid to zero
	 */
	resetGrid();

	/*
	 * put the worm on the grid
	 */
	for( var s = 0; s < _worm.segments.length; ++s ) {
		var segment = _worm.segments[s];
		/*
		 * is this a head segment or body segment?
		 */
		var segmentType = (s == 0) ? 1 : 2;
		_grid[segment.x][segment.y] = segmentType;
	}

	/*
	 * put the apple back on the grid
	 */
	if( true == appleFound ) {
		_grid[applePos.x][applePos.y] = 3;
	}
}

/**
 * create pos-object ({x,y}) at a zero-position on the grid
 */
var getRandomFreePosition = function() {
	var pos = {x: 0, y: 0};
	do {
		pos.x = Math.floor(Math.random() * GRID_SIZE_X);
		pos.y = Math.floor(Math.random() * GRID_SIZE_Y);
	}
	while( _grid[pos.y][pos.x] != 0 );		// is grid at pos != zero?

	return pos;
}

var getUpdateObject = function() {
	updateGrid();

	var update = {};

	update.tickDuration = _tickDuration;
	update.direction = _worm.direction;
	update.grid = _grid;

	return update;
}

/*
 * the HTML WEB SERVER PART
 */
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

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

/**
 * game status
 */
var _status = "not initialized";


/**
 * saves the last postion of crash
 */
var _crashPosition = null;

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
		startGame();
		socket.emit("game started", null);
		_server.sockets.emit("update", getUpdateObject());
	});

	socket.on("requestUpdate", function(data) {
		console.log("received command: requestUpdate");
		if( null == _grid ) {
			return;
		}
		socket.emit("update", getUpdateObject());
	});

	socket.on("turn", function(data) {
		if( 'undefined' == data.direction ) {
			console.log("received command: turn. ERROR: no direction! " + JSON.stringify(data, undefined,2));
			return;
		}

		console.log("received command: turn to " + data.direction);
		
		/*
		 * perform turn
		 */
		turn(data.direction);
	
		/*
		 * update game by one step
		 */
		nextTick();

		/*
		 * notify clients of new state
		 */
		_server.sockets.emit("update", getUpdateObject());
	});

});

var startGame = function() {
	resetGame();
	_status = "running";
}

/**
 * resets the grid and sets new random starting position for the snake and an apple
 */
var resetGame = function() {
	resetGrid();
	resetSnake();
	spawnApple();
	updateGrid();
	_status = "waiting for start";
	_crashPosition = null;
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
 * create a new snake object with a random positon and random direction
 */
var resetSnake = function() {
	/*
	 * get a random direction
	 */
	var directionIndex = Math.floor(Math.random() * 4);

	_snake = {
		direction: directionIndex,
		segments: [getRandomFreePosition()]
	};
	
	console.log("resetting snake to: " + JSON.stringify(_snake));
}

/**
 * look for a free spot on the grid and put an apple there
 */
var spawnApple = function() {
	var applePos = getRandomFreePosition();
	_grid[applePos.x][applePos.y] = 3;
}

/**
 * synchronize grid and snake object
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
	 * put the snake on the grid
	 */
	for( var s = 0; s < _snake.segments.length; ++s ) {
		var segment = _snake.segments[s];
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
	update.direction = _snake.direction;
	update.grid = _grid;
	update.gridSizeX = GRID_SIZE_X;
	update.gridSizeY = GRID_SIZE_Y;
	update.status = _status;
	update.crashPosition = _crashPosition;

	return update;
}

/**
 * save new direction for snake
 */
var turn = function(direction) {
	_snake.direction = direction;
}

/**
 * update game by one step
 */
var nextTick = function() {
	if( _status == "game over" ) {
		return;
	}

	/*
	 * create vector from direction
	 */
	var vector = {x: 0, y: 0};
	switch( _snake.direction ) {
		case 0: {
			vector.x = 0;
			vector.y = -1;
			break;
		}

		case 1: {
			vector.x = 1;
			vector.y = 0;
			break;
		}

		case 2: {
			vector.x = 0;
			vector.y = 1;
			break;
		}

		case 3: {
			vector.x = -1;
			vector.y = 0;
			break;
		}
	}

	/**
	 * check what is in this direction
	 */
	var newPos = {x: _snake.segments[0].x + vector.x, y: _snake.segments[0].y + vector.y};

	/**
	 * grid boundaries
	 */
	if( newPos.x < 0 || newPos.x >= GRID_SIZE_X || newPos.y < 0 || newPos.y >= GRID_SIZE_Y ) {
		_status = "game over";
		_crashPosition = newPos;
		return;
	}

	var value = _grid[newPos.x][newPos.y];

	/**
	 * snake segment
	 */
	if( value == 2 ) {
		_status = "game over";
		_crashPosition = newPos;
		return;
	}

	/**
	 * apple
	 */
	var appleEaten = false;
	if( value == 3 ) {
		
		/*
		 * save event for later respawn of apple
		 */
		appleEaten = true;

		/*
		 * remove old apple
		 */
		_grid[newPos.x][newPos.y] = 0;

		/*
		 * make snake longer
		 */
		var lastSegment = _snake.segments[_snake.segments.length-1];
		var posOfNewSegment = {x: lastSegment.x, y: lastSegment.y};
		_snake.segments.push(posOfNewSegment);
	}
	
	/**
	 * move snake
	 */
	moveSnake(newPos);

	/**
	 * respawn apple if necessary
	 */
	if( appleEaten ) {
		spawnApple();
	}

}

var moveSnake = function(newPos) {
	var targetPos = {x: newPos.x, y: newPos.y};
	for( var i = 0; i < _snake.segments.length; ++i ) {
		var currentSegment = _snake.segments[i];
		var lastPosOfThisSegment = {x: currentSegment.x, y: currentSegment.y};
		currentSegment.x = targetPos.x;
		currentSegment.y = targetPos.y;

		targetPos.x = lastPosOfThisSegment.x;
		targetPos.y = lastPosOfThisSegment.y;
	}
}

/**********************************************************************************
 * boring HTML WEB SERVER PART
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

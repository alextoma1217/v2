const path = require('path');
const http = require('http');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const socketio = require('socket.io');
const favicon = require('serve-favicon');
const formatMessage = require( __dirname +'/public/utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require( __dirname + '/public/utils/users');

let app = express();

let Matrix = require( __dirname + '/server/matrix.js');
let TileCollider = require( __dirname + '/server/tilecollision.js');
let WalkerCollider = require( __dirname + '/server/walkercollision.js');
let WalkerClass = require( __dirname + '/server/walker.js');
let TictactoePlayer = require( __dirname + '/server/tictactoePlayer.js');

// Passport Config
require( __dirname + '/server/config/passport')(passport);

// DB Config
const db = require('./server/config/keys').mongoURI;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true , useUnifiedTopology: true}
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views/'));

// // Express body parser
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});
// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));


app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
// storing player/walkers users
let all_users = {};
let all_walkers = {};
let ticTacToe_array = {};

let numWalkers = 0;

let initialTicTacToeState = [ [], [], [], [], [], [] ];


let AllTictacToePlayers = {};

AllTictacToePlayers.player_set = 
[
   [    [], [], [], [], [], []   ],
   [    [], [], [], [], [], []   ],
   [    [], [], [], [], [], []   ],
   [    [], [], [], [], [], [],  ]
];

// Create Tiles
let gameObjects = new Matrix();
let tileSetter = function(gameObjects, tileType, xStart, xEnd, yStart, yEnd, room, seat) {
	for (let x = xStart; x < xEnd; ++x) {
		for (let y = yStart; y < yEnd; ++y) {
			gameObjects.set(x, y, {
				name:tileType,
				room:room, 
				seat: seat
			});
		}
	}
};
// first
tileSetter(gameObjects, 'table', 2, 3, 4, 5, 1, 3);
tileSetter(gameObjects, 'table', 5, 6, 4, 5,  2, 3);
tileSetter(gameObjects, 'table', 9, 10, 4, 5,  3, 3);
tileSetter(gameObjects, 'table', 11, 12, 4, 5, 4, 3);

let available = [];

let getGameData = function(){

	available = [];

    for(let i=0; i<AllTictacToePlayers.player_set.length; i++){    	
    	if(AllTictacToePlayers.player_set[i][0].length==0){
            available.push('seat');
    	}
    	else{
    		available.push('seat_in');
    	}  
    }

    for(let i=0; i<AllTictacToePlayers.player_set.length; i++){    	
    	  	if(AllTictacToePlayers.player_set[i][1].length==0){
            available.push('seat');
    	}
    else{
    		available.push('seat_in');
    	}
    }
    setSeats();	
}
getGameData();

function setSeats(){
		tileSetter(gameObjects, available[0], 2, 3, 1, 2,  1, 1);
		tileSetter(gameObjects, available[2], 5, 6, 1, 2, 2, 1);
		tileSetter(gameObjects, available[4], 9, 10, 1, 2, 3, 1);
		tileSetter(gameObjects, available[6], 11, 12, 1, 2, 4, 1);
		tileSetter(gameObjects, available[1], 2, 3, 6, 7,  1, 2);
		tileSetter(gameObjects, available[3], 5, 6, 6, 7, 2, 2);
		tileSetter(gameObjects, available[5], 9, 10, 6, 7, 3, 2);
		tileSetter(gameObjects, available[7], 11, 12, 6, 7, 4, 2);
}

let tileCollider = new TileCollider(gameObjects);

let messages_box = {
  collection: []
}

const server = http.createServer(app);
const io = socketio(server);


const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Run when client connects
io.on('connection', socket => {

let walker;
  socket.on('joinRoom', ({ username, room, user_id}) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
      messages: messages_box.collection
    });

    numWalkers++;	
	all_users[socket.id] = socket;
	walker = new WalkerClass(socket.id, numWalkers, username, user_id);
	all_walkers[socket.id] = walker;      
  });
 
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    for (let i in all_walkers) {    	
       if(all_walkers[i].id== socket.id){
         all_walkers[i].message= msg;
       } 
    }
    let message = user.username + ': ' + msg;
    messages_box.collection.unshift(message);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

   socket.on('prompt_in' , user_id => {
    	let room; 
          for (let i in all_walkers) {    	
		       if(all_walkers[i].id== socket.id){
		         all_walkers[i].prompt= 'accepted';
		         room = all_walkers[i].room;
		       } 
         }
	 if (walker.table || walker.seat) {		
			let new_gamer = {
				'name': walker.username,
			     'id': walker.userid,
			     'seat': walker.seat
			}
			if(walker.seat==3){	
				if(AllTictacToePlayers.player_set[walker.room-1][3].length>0){
					let in_array = AllTictacToePlayers.player_set[room-1][3].indexOf(walker.userid)
                   if(in_array == -1 ){
                   	AllTictacToePlayers.player_set[walker.room-1][walker.seat-1].push(new_gamer);
                   }
				}
				else{
				  AllTictacToePlayers.player_set[walker.room-1][walker.seat-1].push(new_gamer);	
				}
			}
			else{
				 AllTictacToePlayers.player_set[walker.room-1][walker.seat-1].push(new_gamer);	
     		}
				getGameData();  				
	     }      
	   socket.emit('startGame' , room);  
  });

   socket.on('prompt_out', user_id => {
      	for (let i in all_walkers) {    	
		       if(all_walkers[i].id== socket.id){
		         all_walkers[i].prompt = false;
		         all_walkers[i].seat = null;
		         all_walkers[i].room = null;
		         all_walkers[i].table = null;
		       } 
         }   
	   socket.emit('cancelGame');
      });


    socket.on('getGameData', ({ user_id, game_room }) => {
    let socketid = socket.id;
    let data = AllTictacToePlayers.player_set[game_room-1];
    let id =socket.id;
    let player = new TictactoePlayer(id, game_room, user_id);
    ticTacToe_array[socket.id] = player; 
    socket.join(game_room);
    io.to(game_room).emit('gameInitialData', {
      data: data
    });
  });

   socket.on('newTictacToeData', ({ game_room, num, player_number, current_turn }) => {   
	    if(player_number == 1){
	    	AllTictacToePlayers.player_set[game_room-1][3].push(num);
	     }
	    else{
	      AllTictacToePlayers.player_set[game_room-1][4].push(num);	
	    }
	    AllTictacToePlayers.player_set[game_room-1][5].push(current_turn);	
	  
	    let data = {
	      newdataX: AllTictacToePlayers.player_set[game_room-1][3],
	      newdataO: AllTictacToePlayers.player_set[game_room-1][4], 
	      number: num
	  };  
	    io.to(game_room).emit('gameUpdate', data);
  });

  	socket.on('finishTicTacToe', game_room => {
        AllTictacToePlayers.player_set[game_room-1] = initialTicTacToeState;
        io.socketsLeave(game_room);
	});

	socket.on('disconnect', () => {	
		delete all_users[socket.id];	
		if (all_walkers[socket.id]) {
			delete all_walkers[socket.id];
			const user = userLeave(socket.id);
           numWalkers--;
	      io.to(user.room).emit('roomExit', {
	        room: user.room,
	        users: getRoomUsers(user.room)
	      });
		} 

		if (ticTacToe_array[socket.id]) {    
             let room = ticTacToe_array[socket.id].room;
             let id = ticTacToe_array[socket.id].userid;
             let seat = ticTacToe_array[socket.id].seat;
             let winner;

          

			  if(AllTictacToePlayers.player_set[room-1][0].length>0 && 
				AllTictacToePlayers.player_set[room-1][1].length>0){

				if(seat ===1){
				  winner =1;	
			    }
			     else if(seat ==2){
				  winner = 2;				
			   }
			   AllTictacToePlayers.player_set[room-1] = initialTicTacToeState;
			    io.to(room).emit('winnerOnDisconnect', winner);
			    delete ticTacToe_array[socket.id];
			         getGameData(); 	
			    return;		    
              }

               else if(AllTictacToePlayers.player_set[room-1][0].length==0 ||
				AllTictacToePlayers.player_set[room-1][1].length ==0){	

							
				 	AllTictacToePlayers.player_set[room-1] = initialTicTacToeState;
			       io.to(room).emit('disconnectNotStarted');
			         delete ticTacToe_array[socket.id];
			           getGameData(); 	
			         return;
			   		   		    
              }
             

              if(seat ===3 ) {              
                let number = AllTictacToePlayers.player_set[room-1][2].indexOf(id);  
                AllTictacToePlayers.player_set[room-1][2].splice(number, 1);
                let spectators_amount = AllTictacToePlayers.player_set[room-1][2].length
                io.to(room).emit('updateSpectators', spectators_amount);                	
              } 

              getGameData(); 
	    }  

  });

	socket.on('keyPress', data => {
		if (walker.state) {
			let max_height = data.max_height;
			let max_width = data.max_width;

			if (data.inputID === 'left') {
				walker.moveLeft();
			} 
			else if (data.inputID === 'right') {
				walker.moveRight(max_height);
			}

			else if (data.inputID === 'down') {
				walker.moveDown(max_height);

			}
			else if (data.inputID === 'up') {			
				walker.moveUp();				
			}
		}
	});

	socket.on('keyRelease', data => {
		if (walker.state) {
			if ((data.inputID === 'left') || (data.inputID === 'right'))  {
				walker.cancelHorizontal();
			} 

			else if ((data.inputID === 'down') || (data.inputID === 'up')) {
		          walker.cancelVertical();				
			}
		}
	});

});

setInterval(() => {
	let positions = [];
	let walkerCollider = new WalkerCollider();
	for (let i in all_walkers) {
		let walker = all_walkers[i];
		walker.updateX();
		tileCollider.checkXWalker(walker);

		walker.updateY();
		tileCollider.checkYWalker(walker);

		walkerCollider.add({
			id: walker.id,
			walker: walker,
			left: walker.pos.x + 2,
			right: walker.pos.x + walker.size.x - 2,
			top: walker.pos.y + 2,
			bottom: walker.pos.y + walker.size.y - 2,
		});
	}

	for (let i in all_walkers) {
		let walker = all_walkers[i];

		positions.push({
			id: walker.id,
			x: walker.pos.x,
			y: walker.pos.y,
			number: walker.number,
			velX: walker.vel.x,
			velY: walker.vel.y,
			direction: walker.direction,
			distance: walker.distance,
			message: walker.message,
			username: walker.username,
			prompt: walker.prompt,
			state: walker.state,
			number: walker.num,
			seat: walker.seat,
		    room:walker.room,
		    table:walker.table
		});
}

	for (let i in all_users) {
		let socket = all_users[i];
		let pack = {
			walkerID: socket.id,
			positions: positions,
			tictactoe: available
		}
		socket.emit('newPosition', pack);
	}	
}, 1000/48);
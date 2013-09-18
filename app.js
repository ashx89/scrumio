var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , api = require('./routes/api')

  // Session and Authentication
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore()

  // Models
  , mongoose = require('mongoose')
  , User = require('./models/user.js')
  , Note = require('./models/note.js');


//======================== Express Middleware setup
var app = express();
var ObjectId = mongoose.Types.ObjectId;


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({
    secret: 'amsterdam', 
    key: 'connect.sid',
    store: sessionStore
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


//======================== Login Authentication
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function(username, password, done) {
    User.findOne({username: username}, function(err, user) {
      if(!user) {
        return done(null, false, {message: 'Incorrect Username!'});
      }
      if(!user.validPassword(password)) {
        return done(null, false, {message: 'Incorrect Password!'});
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


//======================== Routing
app.get('/', routes.index);
app.get('/home', routes.home);
app.get('/home/:username', routes.home);

app.get('/logout', function(req, res){
  req.session.destroy()
  req.logout();
  res.redirect('/');
});

app.post('/',
  passport.authenticate('local'),
    function(req, res) {
      res.redirect('/home/'+req.user.username);
      console.log(req.session.passport);
      console.log(req.cookies);
    }
);

//app.get('/api/users/:account', api.users);


//======================== Server
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//======================== Sockets
var io = require('socket.io').listen(server);
var passportSocket = require('passport.socketio');


//================================= Authourize user
io.set('authorization', passportSocket.authorize({
  key: 'connect.sid',
  secret: 'amsterdam',
  store: sessionStore,
  fail : function(data, accept) { console.log('FAILED at IO auth'); accept(null, false); },
  success: function(data, accept) { console.log('SUCCESS at IO auth'); console.log(data); accept(null, true); }
}));


io.sockets.on('connection', function(socket) {


  socket.account = socket.handshake.user.account;
  socket.join(socket.account);

//================================= Adding a New Note
  socket.on('add', function() {
    Note.create({
      content: 'New Note',
      status: 'todo',
      account: socket.account
    },
      function(err, note) {
        if(err) throw err;
        io.sockets.in(socket.account).emit('newnote', note);
      });

  });

  //================================= Deleting a note
  socket.on('delete', function(data) {
    socket.broadcast.to(socket.account).emit('deleted', {id: data.id});
    Note.find({_id: data.id, account: socket.account}).remove();
  });

  //================================= Moving a note
  socket.on('move', function(data) {
    Note.findByIdAndUpdate(data.id, {'status' : data.droppedId}, function(err) {
        if(err) throw err;
    });
    socket.broadcast.to(socket.account).emit('moved', data);
  });

  //================================= Update note content
  socket.on('contentUpdate', function(data) {
      Note.findOne({_id: ObjectId.fromString(data.pk), account: socket.account}, function(err, note) {
        note.content = data.value;
        note.save();
        socket.broadcast.to(socket.account).emit('updateChanges', note);
      });    
  });
  
  //================================= A New User
  socket.on('newuser', function(data) {
    User.find({username: data.u}, function(err, found) {
      if(err) throw err;
      if(found.length === 0) {
        User.create({username: data.u, password: data.p, account: socket.account}, {safe: true}, function(err, doc) {
          if(err) throw err;
          socket.emit('notification');
        });
      } else {
       socket.emit('notification', found);
       console.log('USER EXISTS!!!!');
      }
    });
  })

});













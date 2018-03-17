var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var format = require('string-format');

var port = 8000;

app.get('/*', function(req, res) {
    res.sendfile('game.html');
});

io.on('connection', function(socket) {
    console.log('A user connected');
    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });
});

http.listen(port, function() {
    console.log(format('Listening on localhost:{}', port));
});
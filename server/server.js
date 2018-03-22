var express = require('express');
var app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);
var format = require('string-format');

var clientDir = __dirname + "/.."
var port = 8000;

app.use(express.static('client/static'))

app.get('/*', function(req, res) {
    res.sendFile('game.html', {root: clientDir + '/client/pages'});
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
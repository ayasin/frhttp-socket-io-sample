var server = require('frhttp').createServer(),
	http = require('http'),

	httpServer = http.createServer(server.runRoute),
	io = require('socket.io')(httpServer),

	socketIOWriter = function (data) {
			io.emit(data.target, data.message);
		};

server.GET('/socket').onValue(function (route) {
	route.render([], function (writer) {
		writer.writeFile('text/html', __dirname +  '/socket_index.html');
	});
});

server.GET('/rest').onValue(function (route) {
	route.render([], function (writer) {
		writer.writeFile('text/html', __dirname +  '/rest_index.html');
	});
});

server.GET('/chat/publish').onValue(function (route) {
	route
		.inject({ioWriter : socketIOWriter})
		.when(server.WHEN.QUERY_STRING)
		.when('initially', [server.CONSTANTS.QUERY_VARS], ['msg', 'source'], function (emit, input) {
			emit.value('source',input[server.CONSTANTS.QUERY_VARS].source);
			emit.value('msg', input[server.CONSTANTS.QUERY_VARS].msg);
			emit.done();
		})
		.when('side-effect publish message', ['msg', 'source', 'ioWriter'], [], function (emit, input) {
			input.ioWriter({
				target: 'chat message',
				message: '(' + input.source + ') : ' + input.msg
			});
			emit.done();
		})
		.render([], function (writer) {
			writer.writeBody('Your message was written to the group');
		});
});

io.on('connection', function (socket) {
	socket.on('chat message', function (data) {
		server.runRouteWithRender(null, 'GET', '/chat/publish', data);
	});
});

httpServer.listen(3000);

var server = require('frhttp').createServer(),
	http = require('http'),

	httpServer = http.createServer(function (req, res) {
		server.runRoute(req, res);
	}),
	io = require('socket.io')(httpServer),

	socketIOWriter = {
		data: function (data) {
			io.emit(data.target, data.message);
		},
		error: function (err) {
			console.log(JSON.stringify(err));
		}
	};

server.GET('/').onValue(function (route) {
	route.render([], function (writer) {
		writer.writeFile('text/html', __dirname +  '/index.html');
	});
});

server.GET('/chat/publish').onValue(function (route) {
	route
		.inject({ioWriter : socketIOWriter})
		.when(server.WHEN.QUERY_STRING)
		.when('initially', [server.CONSTANTS.QUERY_VARS], ['msg', 'source'], function (emit, input) {
			emit.value('source','HTTP/GET');
			emit.value('msg', input[server.CONSTANTS.QUERY_VARS].msg);
			emit.done();
		})
		.when('publish message', ['msg', 'source', 'ioWriter'], [], function (emit, input) {
			input.ioWriter.data({
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
		server.runRouteWithRender(socketIOWriter, 'GET', '/chat/publish', {source: 'WebSocket', msg: data}, [], function () {});
	})
});

httpServer.listen(3000);
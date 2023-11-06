import WebSocket from 'ws';

//#1 fetch the token
fetch('https://sy.idp.liveperson.net/api/account/39390959/signup', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' }
})
	.then((res) => res.json())
	.then((data) => {
		console.log(`token: ${JSON.stringify(data.jwt)}`);
		//send token
		socketToMe(data.jwt)
	})
.catch(err => console.log(err));

//#2 use token in WS request
const socketToMe = (token) => {
	//header object
	let options = {
			headers: {
					Authorization: `JWT ${token}`
			}
	};

	// define websocket connection
	const ws = new WebSocket('wss://sy.msg.liveperson.net/ws_api/account/39390959/messaging/consumer?v=3', options);

	ws.on('error', console.error);
	
	ws.on('open', function open() {
		console.log('opening ws..');
		//new conversation request
		let msg = {
			kind: 'req',
			id: 1,
			type: 'cm.ConsumerRequestConversation'
		};
		//#3 request new conversation
		ws.send(JSON.stringify(msg));
	});
	
	ws.on('close', function close(data) {
		console.log(`disconnected: ${data}`);
	});
	
	ws.on('message', function message(data) {
		console.log(`message: ${data}`);
		// convo response
		let res = JSON.parse(data);
		// convo response (possible switch for different msg types)
		if(res.code === 200 && res.type === 'cm.RequestConversationResponse' && res.body.conversationId) {
			let convo = {
				kind: 'req',
				id: 2,
				type: 'ms.PublishEvent',
				body: {
						dialogId: res.body.conversationId,
						event: {
							type: 'ContentEvent',
							contentType: 'text/plain',
							message: 'My first message'
					}
				}
			};
			console.log(`convo: ${JSON.stringify(convo)}`);
			//#4 publish new conversation
			ws.send(JSON.stringify(convo));
		}
	});
}
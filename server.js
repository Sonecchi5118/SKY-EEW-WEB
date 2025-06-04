const WebSocket = require('ws');

const isReplay = false;
/**@type {import("./type.js").Timestamp} */
const replayTime = '2025-01-13T21:19:30+0900'

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
    console.log('クライアントが接続しました');
});


import { WebSocketServer } from 'ws';

console.log('Creating test WebSocket server...');
const wss = new WebSocketServer({ port: 3002 });

wss.on('listening', () => {
  console.log('✅ Test WebSocket server listening on port 3002');
});

wss.on('connection', (ws) => {
  console.log('✅ New connection received');
  ws.send('Hello from test server!');
  ws.on('message', (data) => {
    console.log('📥 Received:', data.toString());
  });
});

wss.on('error', (error) => {
  console.error('❌ Server error:', error);
});

console.log('Test server setup complete. Try connecting to ws://localhost:3002');

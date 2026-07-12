import { io, Socket } from "socket.io-client";

// Create a single socket connection to the backend server
const socket: Socket = io("http://localhost:5000", {
  autoConnect: false, // We'll connect manually after checking for a token if needed
});

export default socket;

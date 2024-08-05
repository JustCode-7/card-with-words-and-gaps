import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";

export const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.send("Hello World!");
})

io.on('connection', (socket) => {
    console.log('a user connected');

    console.log(socket.data);

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000");
})
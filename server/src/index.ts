import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import {createRoom, getRooms, joinRoom} from "./rooms.js";

export const app = express();
const server = createServer(app);
const io = new Server(server, {cors: {origin: '*'}});

app.get("/", (req, res) => {
    res.send("Hello World!")
})

io.on('connection', (socket) => {
    console.log('a user connected')

    socket.on('join-room', (data) => {
        socket.join(data.room)
        joinRoom(data.room, data.participant)
        socket.to(data.room).emit("room",)
    })

    socket.on('create-room', (room: string) => {
        socket.join(room)
        createRoom(room)
        socket.emit("room-list", getRooms())
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000")
})
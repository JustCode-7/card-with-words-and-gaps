import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import {createRoom, getRoomById, getRoomIds, joinRoom} from "./rooms.js";
import cors from "cors";

export const app = express();
app.use(cors()) // TODO CORS security
const server = createServer(app);
const io = new Server(server, {cors: {origin: '*'}}); // TODO CORS security

app.get("/", (req, res) => {
    res.send("Server is alive")
})

app.get("/rooms", (req, res) => {
    res.send(getRoomIds())
})

io.on('connection', (socket) => {
    console.log('a user connected')

    socket.on('join-room', ({roomId, player}) => {
        socket.join(roomId)
        joinRoom(roomId, player)
        socket.to(roomId).emit("room-players", getRoomById(roomId).players)
    })

    socket.on('create-room', (roomId: string) => {
        socket.join(roomId)
        createRoom(roomId)
        socket.emit("room-list", getRoomIds())
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000")
})
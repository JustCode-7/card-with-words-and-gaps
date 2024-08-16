import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import {createRoom, getRoomById, getRoomIds, joinRoom} from "./rooms.js";
import cors from "cors";
import {drawAnswerCard, initCardMapFor} from "./services/card.state.js";
import {Player} from "./model/player.js";

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


interface JoinRoomEvent {
    room: string; // uuid v4
    player: Player
}

io.on('connection', (socket) => {
    console.log('a user connected')

    socket.on('join-room', ({room, player}: JoinRoomEvent) => {
        console.log(`Player ${player.id}/${player.name} joined room ${room}`)

        socket.join(room)
        joinRoom(room, player)
        socket.to(room).emit("room-players", getRoomById(room).players)

        // TODO draw cards, setup player, maybe start game page (aka lobby)? to initialize proper data
        const answerCard = drawAnswerCard(room)
        socket.emit('answer-card', answerCard)
        socket.emit('join-room', `Hello ${player.name}, you successfully joined room ${room}`)
    })

    socket.on('create-room', (room: string) => {
        socket.join(room)
        createRoom(room)
        initCardMapFor(room)
        socket.emit("room-list", getRoomIds())
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000")
})

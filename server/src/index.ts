import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import {createRoom, getRoomById, getRoomIds, joinRoom, roomExists} from "./services/room.state.js";
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

app.get("/room", (req, res) => {
    res.send(getRoomIds())
})

app.get("/room/:roomId", (req, res) => {
    const roomId = req.params.roomId
    if (!roomExists(roomId)) {
        res.sendStatus(404)
        return
    }
    const room = getRoomById(roomId)
    res.send(room)
})

app.get("/room/:roomId/players", (req, res) => {
    const roomId = req.params.roomId
    if (!roomExists(roomId)) {
        res.sendStatus(404)
        return
    }
    const players = getRoomById(roomId)!.players
    res.send(players)
})


interface JoinRoomEvent {
    roomId: string; // uuid v4
    player: Player
}

io.on('connection', (socket) => {
    console.debug('a user connected', socket.id)

    socket.on('create-room', (roomId: string) => {
        if (roomExists(roomId)) {
            console.warn(`room '${roomId}' already exists`)
            socket.emit('create-room', {
                createRoomSucceeded: false,
                msg: `Failed to create room '${roomId}'`
            })
            return;
        }

        createRoom(roomId)
        initCardMapFor(roomId)
        socket.emit("room-list", getRoomIds()) // to sender
        socket.broadcast.emit("room-list", getRoomIds()) // to everyone but the sender
    })

    socket.on('join-room', ({roomId, player}: JoinRoomEvent) => {
        if (!roomExists(roomId) || player.id == null || player.name == null) {
            socket.emit('join-room', {
                joinRoomSucceeded: false,
                msg: `Failed to join room '${roomId}'`
            })
            console.warn(`Player ${player.id}/${player.name} failed to join ${roomId}`)
            return;
        }

        joinRoom(roomId, player);
        socket.join(roomId)
        socket.to(roomId).emit("room-players", getRoomById(roomId)!.players)
        console.log(`Player ${player.id}/${player.name} joined room ${roomId}`)
    })

    socket.on('start-game', (roomId: string) => {
        console.log('received start-game command', roomId)
        socket.emit("start-game")
        socket.to(roomId).emit("start-game")
    })

    socket.on('game-events', ({roomId, player}) => {

        // TODO draw cards, setup player, maybe start game page (aka lobby)? to initialize proper data
        const answerCard = drawAnswerCard(roomId)
        socket.emit('answer-card', answerCard)
        socket.emit('join-room', {
            joinRoomSucceeded: true,
            msg: `Hello ${player.name}, you successfully joined room ${roomId}`
        })

    })

    socket.on('disconnect', () => {
        console.debug('user disconnected', socket.id)
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000")
})

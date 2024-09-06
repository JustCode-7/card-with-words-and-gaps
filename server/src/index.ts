import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import {createRoom, getPlayer, getRoomById, getRoomIds, joinRoom, roomExists} from "./services/room.state.js";
import cors from "cors";
import {drawAnswerCard, getCards, getGapCard, initCardMapFor} from "./services/card.state.js";
import {initGameObjects} from "./services/game-initalizer.service.js";
import {JoinRoomEvent} from "./model/event.js";
import {getPlayerCards} from "./services/player-card.state.js";
import {serializeMap} from "./util/serialize-map.util.js";
import {getCatlord} from "./services/catlord.state.js";

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

app.get("/room/:roomId/catlord", (req, res) => {
    const roomId = req.params.roomId
    if (!roomExists(roomId)) {
        res.sendStatus(404)
        return
    }
    const playerId = getCatlord(roomId)!
    const payload = {catlord: getPlayer(roomId, playerId)}
    res.send(payload)
})

app.get("/room/:roomId/gap-card", (req, res) => {
    const roomId = req.params.roomId
    if (!roomExists(roomId)) {
        res.sendStatus(404)
        return
    }
    const payload = {gapCard: getGapCard(roomId)}
    res.send(payload)
})

app.get("/room/:roomId/cards", (req, res) => {
    const roomId = req.params.roomId
    if (!roomExists(roomId)) {
        res.sendStatus(404)
        return
    }
    res.send(getCards(roomId))
})

app.get("/room/:roomId/player-cards", (req, res) => {
    const roomId = req.params.roomId
    if (!roomExists(roomId)) {
        res.sendStatus(404)
        return
    }
    res.send(serializeMap(getPlayerCards(roomId)))
})

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
        initGameObjects(roomId)
        socket.emit("start-game") // start game for sender
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

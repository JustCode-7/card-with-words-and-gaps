import {createServer} from 'http';
import {Server} from 'socket.io';
import {Game} from "./data-model/game-model.js";
import express, {Express} from 'express';

export class AppServer {
    public static readonly PORT: number = 3000;
    app: Express = express();
    httpServer: any;
    io: any;
    port: any;
    private rooms = ["#DEFAULT_ROOM#"];
    private game: Game | undefined;

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.httpServer = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || AppServer.PORT;
    }

    private sockets(): void {
        //TODO: allow cors just for test
        this.io = new Server(this.httpServer, {cors: {origin: '*',}});

    }

    private getLocalDateTime() {
        return new Date().toDateString() +" | "+new Date().toLocaleTimeString();
    }



    private async listen(): Promise<void> {
        this.io.listen(this.port, () => {
            console.log(this.getLocalDateTime() + ' [server]-> Running server on port %s', this.port);
        });



        this.io.on('connection', async (socket: any) => {


            console.log(this.getLocalDateTime() + ' [server]-> Connected socket with socketID[%s] on port %s.', socket.id, this.port);
            this.registerEvents(socket);

        });

    }


    private registerEvents(socket: any) {
        socket.on('connect',() => {
            console.log(this.getLocalDateTime() + 'a new client connected %s', socket.id);
            socket.emit('roomID', this.rooms);
        });

        socket.on('setGame',(roomID: string, game:Game) => {
            console.log(this.getLocalDateTime() + ' [server]-> (socketid): %s\n (RoomID): %s', socket.id, roomID);
            this.io.in(socket.id).socketsLeave(socket.rooms.values().next().value);
            this.rooms.push(roomID);
            console.log(this.getLocalDateTime() + ' [server]-> SET GAME'+ JSON.stringify(game));
            this.game = game;
            socket.emit('game',this.game);
        });

        socket.on('getGame',(roomID: string) => {
            console.log(this.getLocalDateTime() + ' [server]-> (socketid): %s\n (RoomID): %s', socket.id, roomID);
            this.io.in(socket.id).socketsLeave(socket.rooms.values().next().value);
            this.rooms.push(roomID);
            console.log(this.getLocalDateTime() + ' [server]-> GET GAME'+ JSON.stringify(this.game));
            socket.emit('game',this.game);
        });

        socket.on('updateGame',(game:Game) => {
            console.log(this.getLocalDateTime() + ' [server]-> (socketid): %s\n -> Call UpdateGame', socket.id);
            console.log(this.getLocalDateTime() + ' [server]-> UPDATE GAME'+ JSON.stringify(game));
            if(game.spieler.length !== 0 && this.game !== game){
                this.game = game;
            }
        });

        socket.on('getRoomID', () => {
            console.log(this.getLocalDateTime() + ' [server]-> (socketid): %s\n (RoomID): %s', socket.id, socket.rooms);
            socket.emit('roomID', this.rooms);
        });

        socket.on('joinRoomID', async (roomID: string) => {
            this.io.in(socket.id).socketsLeave(socket.rooms.values().next().value);
            socket.join(roomID);
            console.log(this.getLocalDateTime() + ' [server]-> joint (socketid): %s\n (RoomID): %s', socket.id, roomID);
            socket.emit('game', this.game);
            await this.getAllSocketsOfRoom();
        });

        socket.on('reconnect', (socket: any) => {
            console.log(this.getLocalDateTime() + ' [server]->  socket with id %s try reconnect', socket.id);
        });
        socket.on('disconnect', (socket: any) => {
            console.log(this.getLocalDateTime() + ' [server]-> socket with id %s disconnected', socket.id);
        });
    }

    private async getAllSocketsOfRoom() {
        for (const room of this.rooms) {
            const sockets = await this.io.in(room).fetchSockets();
            if(sockets.length !== 0){
                console.log(`socket from Room:  ${room} - START: für %s Sockets`, sockets.length);
                for (const socket of sockets) {
                    console.log(`Socket-ID: ${socket.id}`);
                    // console.log(`Handshake:`);
                    // console.log(socket.handshake);
                    console.log(`Rooms:`);
                    console.log(socket.rooms);
                    // console.log(`Data:`);
                    // console.log(socket.data);
                    // socket.emit("hello");
                    // socket.join("room1");
                    // socket.leave("room2");
                    // socket.disconnect();
                }
                console.log("socket from Room - END");
            }
        }
    }

    public getApp(): express.Application {
        this.app.get('/',
            function (req, res) {
                res.sendStatus(200);
            })
        return this.app;
    }

}
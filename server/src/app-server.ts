import {createServer} from 'http';
import {Server} from 'socket.io';
import {Message} from "./data-modal/game-modal";
import express, {Express} from 'express';

export class AppServer {
    public static readonly PORT: number = 3000;
    app: Express = express();
    httpServer: any;
    io: any;
    port: any;

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

    private listen(): void {
        this.httpServer.listen(this.port, () => {
            console.log('[server]\nRunning server on port %s', this.port);
        });

        this.io.on('connection', (socket: any) => {
            socket.join("gameRoom1");
            console.log('[ServerRooms]');
            socket.rooms.forEach((room: string) => console.log('Roomname: ' + room))
            console.log('[server]\nConnected client with socketID[%s] on port %s.', socket.id, this.port);
            socket.on('message', (m: Message) => {
                console.log('[server]\n (socketid): %s\n (message): %s', socket.id, JSON.stringify(m));
                this.io.emit('message', m);
            });
            socket.on('reconnect', (socket: any) => {
                console.log('[server]\nclient try reconnect');
            });
            socket.on('disconnect', (socket: any) => {
                console.log('[server]\nclient disconnected');
            });
        });
    }

    public getApp(): express.Application {
        this.app.get('/',
            function (req, res) {
                res.sendStatus(200);
            });
        return this.app;
    }
}
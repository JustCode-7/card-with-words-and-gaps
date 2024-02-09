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
        this.io = new Server(this.httpServer);

    }

    private listen(): void {
        this.httpServer.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: any) => {
            console.log('Connected client on port %s.', this.port);
            socket.on('message', (m: Message) => {
                console.log('[server](message): %s', JSON.stringify(m));
                this.io.emit('message', m);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
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
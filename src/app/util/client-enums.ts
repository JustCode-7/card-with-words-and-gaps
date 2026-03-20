// Actions you can take on the App
export enum MYAction {
  JOINED,
  LEFT,
  RENAME
}

// Socket.io events
export enum SocketEvent {
  CONNECT = 'connection',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect'
}

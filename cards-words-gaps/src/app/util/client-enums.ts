// Actions you can take on the App
export enum MYAction {
  JOINED,
  LEFT,
  RENAME
}

// Socket.io events
export enum MYEvent {
  CONNECT = 'connection',
  DISCONNECT = 'disconnect'
}

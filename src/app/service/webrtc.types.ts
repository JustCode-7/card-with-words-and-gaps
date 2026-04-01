export type ConnectionType = 'local' | 'p2p' | 'relay' | 'unknown';

export enum WebRTCMode {
  LOCAL = 'local',
  ONLINE = 'online'
}

export interface PeerStatus {
  state: 'disconnected' | 'connecting' | 'connected';
  type: ConnectionType;
}

export interface FireRoom {
  createdAt: any;     // WICHTIG: Nutze serverTimestamp() für die Security Rules
  hostOffer?: string;    // Der optimierte & komprimierte SDP-String
  roomId?: string;       // Raumnummer für SocketService
  answers?: Record<string, string>; // Antworten der Clients (clientId -> compressed SDP)
  status: 'waiting' | 'connected';
}

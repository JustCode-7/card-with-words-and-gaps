import {Injectable, signal, WritableSignal} from '@angular/core';
import * as QRCode from 'qrcode';
import * as LZString from 'lz-string';
import {Subject} from 'rxjs';

export type ConnectionType = 'local' | 'p2p' | 'relay' | 'unknown';

export interface PeerStatus {
  state: 'disconnected' | 'connecting' | 'connected';
  type: ConnectionType;
}

@Injectable({providedIn: 'root'})
export class WebRTCService {
  public connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  public individualStatus = new Map<string, WritableSignal<PeerStatus>>();
  public activeConnections = signal<string[]>([]);
  public message$ = new Subject<any>();
  public connectionDisconnected$ = new Subject<string>();

  public peerConnections: Map<string, RTCPeerConnection> = new Map();
  public pendingConnectionId = signal<string | null>(null);

  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private pendingConnectionIds: Set<string> = new Set();

  private config: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
  };

  // Maximaler Puffer für den DataChannel (16 MB) zum Schutz vor Abstürzen
  private readonly MAX_BUFFER_SIZE = 16 * 1024 * 1024;

  constructor() {
  }

  public restorePendingConnection(id: string) {
    console.log(`[DEBUG_LOG] WebRTC: Adding ${id} to pendingConnectionIds`);
    this.pendingConnectionIds.add(id);

    if (!this.peerConnections.has(id)) {
      console.warn(`[DEBUG_LOG] WebRTC: Connection ${id} not found in peerConnections. Handshake might fail if this is a new PC.`);
    }
  }

  // ==========================================
  // HOST Side
  // ==========================================
  async createOffer(roomId: string): Promise<string> {
    console.warn(`[DEBUG_LOG] WebRTC: Creating offer for room ${roomId}`);
    const connectionId = Math.random().toString(36).substring(2, 9);
    this.pendingConnectionIds.add(connectionId);

    const pc = this.initPeerConnection(connectionId);
    const dc = pc.createDataChannel("game-data");
    this.setupDataChannel(dc, connectionId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ICE gathering
    await this.waitForIceGathering(pc);

    // OPTIMIERT: SDP minimieren für kleinere QR-Codes
    let sdp = pc.localDescription!.sdp;
    const optimizedSdp = this.optimizeSdp(sdp);

    console.warn(`[DEBUG_LOG] WebRTC: Offer SDP generated (length: ${optimizedSdp.length}), connectionId: ${connectionId}`);

    const packet = {sdp: optimizedSdp, roomId, connectionId};
    return LZString.compressToEncodedURIComponent(JSON.stringify(packet));
  }

  async handleAnswer(compressedAnswer: string) {
    console.warn(`[DEBUG_LOG] WebRTC: Handling answer...`);

    let decompressed = LZString.decompressFromEncodedURIComponent(compressedAnswer.trim());

    if (!decompressed) {
      console.warn("[DEBUG_LOG] WebRTC: Answer decompression failed! Attempting recovery...");
      const sanitized = compressedAnswer.trim().replace(/ /g, '+');
      decompressed = LZString.decompressFromEncodedURIComponent(sanitized);
    }

    if (decompressed) {
      let pc: RTCPeerConnection | undefined;
      let sdp: string | undefined;
      let connectionId: string | null = null;

      try {
        const packet = JSON.parse(decompressed);
        sdp = packet.sdp;
        connectionId = packet.connectionId;
      } catch (e) {
        sdp = decompressed;
      }

      if (connectionId) {
        pc = this.peerConnections.get(connectionId);
        this.individualStatus.get(connectionId)?.set({state: 'connecting', type: 'unknown'});
      }

      // Fallbacks für fehlende IDs...
      if (!pc && this.pendingConnectionIds.size > 0) {
        if (this.pendingConnectionIds.size === 1) {
          const id = Array.from(this.pendingConnectionIds)[0];
          pc = this.peerConnections.get(id);
        } else if (connectionId && this.pendingConnectionIds.has(connectionId)) {
          pc = this.peerConnections.get(connectionId);
        }
      }

      if (!pc && this.peerConnections.size === 1) {
        pc = Array.from(this.peerConnections.values())[0];
      }

      if (pc && sdp) {
        // NEU: Toleranterer Status-Check (falls wir später ICE-Restarts nutzen)
        if (pc.signalingState !== 'have-local-offer' && pc.signalingState !== 'stable') {
          console.warn(`[DEBUG_LOG] WebRTC: Cannot set remote answer in state ${pc.signalingState}.`);
          return;
        }

        const sanitizedSdp = this.optimizeSdp(sdp);
        await pc.setRemoteDescription({type: 'answer', sdp: sanitizedSdp});

        if (connectionId) {
          this.pendingConnectionIds.delete(connectionId);
        } else {
          for (const [id, p] of this.peerConnections.entries()) {
            if (p === pc) {
              this.pendingConnectionIds.delete(id);
              break;
            }
          }
        }
      } else {
        console.error(`[DEBUG_LOG] WebRTC ERROR: No matching peer connection found.`);
      }
    }
  }

  // ==========================================
  // CLIENT Side
  // ==========================================
  async createAnswer(compressedOffer: string): Promise<{ answer: string, roomId: string }> {
    console.warn(`[DEBUG_LOG] WebRTC: Creating answer...`);

    let offerPacketString = LZString.decompressFromEncodedURIComponent(compressedOffer.trim());

    if (!offerPacketString) {
      const sanitized = compressedOffer.trim().replace(/ /g, '+');
      offerPacketString = LZString.decompressFromEncodedURIComponent(sanitized);
    }

    if (!offerPacketString) throw new Error("Invalid offer (decompression failed)");

    const packet = JSON.parse(offerPacketString);
    let sdpOffer = packet.sdp;

    const roomId = packet.roomId || "P2P-Room";
    const connectionId = packet.connectionId || Math.random().toString(36).substring(2, 9);

    const pc = this.initPeerConnection(connectionId);

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      this.setupDataChannel(dc, connectionId);
    };

    try {
      const sanitizedSdp = this.optimizeSdp(sdpOffer);
      await pc.setRemoteDescription({type: 'offer', sdp: sanitizedSdp});

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await this.waitForIceGathering(pc);

      const optimizedAnswerSdp = this.optimizeSdp(pc.localDescription!.sdp);

      const answerPacket = {sdp: optimizedAnswerSdp, connectionId};
      const answerCompressed = LZString.compressToEncodedURIComponent(JSON.stringify(answerPacket));

      return {answer: answerCompressed, roomId};
    } catch (err: any) {
      console.error(`[DEBUG_LOG] WebRTC: SDP Error: ${err.message}`);
      throw err;
    }
  }

  // ==========================================
  // MESSAGING & UTILS
  // ==========================================
  async generateQRCode(text: string): Promise<string> {
    return await QRCode.toDataURL(text);
  }

  sendMessage(data: any) {
    const payload = JSON.stringify(data);
    this.dataChannels.forEach((dc, id) => {
      if (dc.readyState === 'open') {
        // OPTIMIERT: Schutz vor DataChannel-Überlauf
        if (dc.bufferedAmount > this.MAX_BUFFER_SIZE) {
          console.warn(`[DEBUG_LOG] WebRTC: Puffer voll für ${id}. Nachricht wird ignoriert, um Crash zu vermeiden.`);
          return;
        }
        dc.send(payload);
      }
    });
  }

  // NEU: Funktion, um die Verbindungsqualität (Pfad) auszulesen
  public async logConnectionStats(id: string) {
    const pc = this.peerConnections.get(id);
    if (!pc) return;

    const stats = await pc.getStats();
    let detectedType: ConnectionType = 'unknown';

    (stats as any).forEach((report: any) => {
      // Wir suchen das aktive (succeeded) Paar
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const local = (stats as any).get(report.localCandidateId);

        // Zuordnung der WebRTC-Begriffe zu lesbaren Typen
        switch (local?.candidateType) {
          case 'host':
            detectedType = 'local';
            break;    // Gleiches Netzwerk
          case 'srflx':
            detectedType = 'p2p';
            break;     // Über STUN (Internet)
          case 'relay':
            detectedType = 'relay';
            break;   // Über TURN (Server)
        }
      }
    });

    // Signal aktualisieren, ohne den Status zu überschreiben
    const currentSignal = this.individualStatus.get(id);
    if (currentSignal) {
      currentSignal.update(prev => ({...prev, type: detectedType}));
    }
  }

  public closeAllConnections() {
    console.warn(`[DEBUG_LOG] WebRTC: Closing all ${this.peerConnections.size} connections`);
    Array.from(this.peerConnections.keys()).forEach(id => this.cleanupConnection(id));

    this.individualStatus.forEach(status => status.set({state: 'disconnected', type: 'unknown'}));
    this.individualStatus.clear();
    this.activeConnections.set([]);
    this.connectionStatus.set('disconnected');
    this.pendingConnectionIds.clear();
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  // OPTIMIERT: Smarteres Timeout. Löst schneller auf, wenn eine öffentliche IP gefunden wurde.
  private async waitForIceGathering(pc: RTCPeerConnection) {
    console.warn("[DEBUG_LOG] WebRTC: Waiting for ICE gathering...");
    const isLocal = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
    const timeoutMs = isLocal ? 500 : 5000;

    await new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') {
        resolve(true);
        return;
      }

      let fastResolveTimer: any;

      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          cleanupAndResolve();
        }
      };

      const checkCandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate && (event.candidate.type === 'srflx' || event.candidate.type === 'relay')) {
          // Wir haben eine externe IP. Warte noch kurz auf Nachzügler, dann brich das Warten ab.
          if (!fastResolveTimer) {
            fastResolveTimer = setTimeout(() => {
              console.warn("[DEBUG_LOG] WebRTC: srflx Kandidat gefunden. Beschleunige Handshake.");
              cleanupAndResolve();
            }, 800);
          }
        }
      };

      const cleanupAndResolve = () => {
        pc.removeEventListener('icegatheringstatechange', checkState);
        pc.removeEventListener('icecandidate', checkCandidate);
        clearTimeout(fallbackTimer);
        if (fastResolveTimer) clearTimeout(fastResolveTimer);
        resolve(true);
      };

      pc.addEventListener('icegatheringstatechange', checkState);
      pc.addEventListener('icecandidate', checkCandidate);

      const fallbackTimer = setTimeout(() => {
        console.warn(`[DEBUG_LOG] WebRTC: ICE gathering timeout (${timeoutMs}ms), continuing...`);
        cleanupAndResolve();
      }, timeoutMs);
    });
  }

  // NEU: Minimiert das SDP für kleinere Datengrößen (gut für QR-Codes)
  private optimizeSdp(sdp: string): string {
    let lines = sdp.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    lines = lines.filter(line => {
      // Entferne Header-Extensions, die für reine Datenkanäle nutzlos sind
      if (line.startsWith('a=extmap:')) return false;
      // Entferne MSID-Semantik (relevant für MediaStreams, nicht für pure DataChannels)
      if (line.startsWith('a=msid-semantic:')) return false;
      return true;
    });

    return lines.join('\r\n') + '\r\n';
  }

  private initPeerConnection(id: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.config);
    this.peerConnections.set(id, pc);

    // In initPeerConnection:
    if (!this.individualStatus.has(id)) {
      this.individualStatus.set(id, signal<PeerStatus>({state: 'disconnected', type: 'unknown'}));
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      const statusSignal = this.individualStatus.get(id);

      console.warn(`[DEBUG_LOG] ICE Connection State (${id}):`, state);

      if (state === 'connected' || state === 'completed') {
        // 1. Globalen Status setzen (mindestens einer ist online)
        this.connectionStatus.set('connected');

        // 2. Einzel-Status auf 'connected' setzen.
        // Wir nutzen .update(), um ein eventuell schon erkanntes 'type' nicht zu löschen
        statusSignal?.update(prev => ({...prev, state: 'connected'}));

        // 3. ID zur Liste der aktiven Verbindungen hinzufügen (für dein HTML ngFor)
        if (!this.activeConnections().includes(id)) {
          this.activeConnections.update(prev => [...prev, id]);
        }

        // 4. Pfad-Analyse
        // Wir warten 1 Sekunde, damit der Browser die Statistiken stabilisiert hat
        setTimeout(() => this.logConnectionStats(id), 1000);

      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        // Hier kommt dein bisheriger Cleanup-Code (cleanupConnection(id) etc.)
        this.cleanupConnection(id);
      }
    };
    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel, id: string) {
    this.dataChannels.set(id, channel);

    if (!this.individualStatus.has(id)) {
      this.individualStatus.set(id, signal<PeerStatus>({state: 'disconnected', type: 'unknown'}));
    }
    const statusSignal = this.individualStatus.get(id)!;

    channel.onopen = () => {
      this.pendingConnectionId.set(null);
      this.connectionStatus.set('connected');
      statusSignal.set({state: 'connected', type: 'unknown'});
      if (!this.activeConnections().includes(id)) {
        this.activeConnections.update(prev => [...prev, id]);
      }
    };

    channel.onclose = () => {
      this.cleanupConnection(id);
    };

    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      data._connectionId = id;
      this.message$.next(data);
    };
  }

  // NEU: Zentralisierte Cleanup-Funktion gegen Memory Leaks
  private cleanupConnection(id: string) {
    console.warn(`[DEBUG_LOG] Cleaning up connection: ${id}`);

    const dc = this.dataChannels.get(id);
    if (dc) {
      dc.onopen = null;
      dc.onclose = null;
      dc.onmessage = null;
      dc.close();
      this.dataChannels.delete(id);
    }

    const pc = this.peerConnections.get(id);
    if (pc) {
      pc.oniceconnectionstatechange = null;
      pc.ondatachannel = null;
      pc.close();
      this.peerConnections.delete(id);
    }

    this.pendingConnectionIds.delete(id);
    this.individualStatus.get(id)?.set({state: 'disconnected', type: 'unknown'});
    this.activeConnections.update(prev => prev.filter(cid => cid !== id));
    this.connectionDisconnected$.next(id);

    const allDisconnected = Array.from(this.peerConnections.values())
      .every(p => p.iceConnectionState === 'disconnected' || p.iceConnectionState === 'failed' || p.iceConnectionState === 'closed');

    if (allDisconnected || this.peerConnections.size === 0) {
      this.connectionStatus.set('disconnected');
    }
  }
}

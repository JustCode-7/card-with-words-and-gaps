import {Injectable, signal, WritableSignal} from '@angular/core';
import * as QRCode from 'qrcode';
import * as LZString from 'lz-string';
import {Subject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class WebRTCService {
  public connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  public individualStatus = new Map<string, WritableSignal<'disconnected' | 'connecting' | 'connected'>>();
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

  constructor() {
  }

  /**
   * Stellt eine ausstehende Verbindung wieder her, falls die Seite neu geladen wurde.
   */
  public restorePendingConnection(id: string) {
    console.log(`[DEBUG_LOG] WebRTC: Adding ${id} to pendingConnectionIds`);
    this.pendingConnectionIds.add(id);

    if (!this.peerConnections.has(id)) {
      console.warn(`[DEBUG_LOG] WebRTC: Connection ${id} not found in peerConnections. Handshake might fail if this is a new PC.`);
    }
  }

  // HOST Side
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

    let sdp = pc.localDescription!.sdp;

    // Wir erzeugen eine saubere SDP-Zeilenstruktur (CRLF)
    // Manche Browser/Umgebungen haben Probleme mit nur LF
    const normalizedSdp = sdp.split('\n').map(line => line.trim()).join('\r\n') + '\r\n';

    console.warn(`[DEBUG_LOG] WebRTC: Offer SDP generated (length: ${normalizedSdp.length}), connectionId: ${connectionId}`);
    // Wir packen den Raumnamen und die Verbindungs-ID mit in das Paket
    const packet = {sdp: normalizedSdp, roomId, connectionId};
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
      console.warn(`[DEBUG_LOG] WebRTC: Answer decompressed (length: ${decompressed.length})`);

      let pc: RTCPeerConnection | undefined;
      let sdp: string | undefined;
      let connectionId: string | null = null;

      try {
        // Versuche als JSON zu parsen (neues Format mit connectionId)
        const packet = JSON.parse(decompressed);
        sdp = packet.sdp;
        connectionId = packet.connectionId;
        console.warn(`[DEBUG_LOG] WebRTC: Parsed answer packet, connectionId: ${connectionId}`);
      } catch (e) {
        // Fallback: Altes Format (nur SDP)
        sdp = decompressed;
        console.warn(`[DEBUG_LOG] WebRTC: Answer is not JSON, treating as raw SDP (fallback)`);
      }

      if (connectionId) {
        pc = this.peerConnections.get(connectionId);
        // TODO:
        this.individualStatus.set(connectionId, signal<'disconnected' | 'connecting' | 'connected'>('connecting'));
      }

      if (!pc && this.pendingConnectionIds.size > 0) {
        // Fallback: Wenn wir keine ID im Paket haben, schauen wir in den ausstehenden Verbindungen nach
        // Falls nur eine aussteht, nehmen wir diese.
        if (this.pendingConnectionIds.size === 1) {
          const id = Array.from(this.pendingConnectionIds)[0];
          pc = this.peerConnections.get(id);
          console.warn(`[DEBUG_LOG] WebRTC: Using single pending connection ${id} as fallback.`);
        } else if (connectionId && this.pendingConnectionIds.has(connectionId)) {
          pc = this.peerConnections.get(connectionId);
        }
      }

      // Letzter Fallback: Wenn wir genau eine PeerConnection haben, nehmen wir diese
      if (!pc && this.peerConnections.size === 1) {
        pc = Array.from(this.peerConnections.values())[0];
        console.warn("[DEBUG_LOG] WebRTC: Using single existing PeerConnection as fallback.");
      }

      if (pc && sdp) {
        if (pc.signalingState !== 'have-local-offer') {
          console.warn(`[DEBUG_LOG] WebRTC: Cannot set remote answer in state ${pc.signalingState}. Connection might already be established or in wrong state.`);
          return;
        }

        console.warn(`[DEBUG_LOG] WebRTC: Setting remote description.`);
        // Normalisiere Antwort-SDP
        const sanitizedSdp = sdp.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\r\n') + '\r\n';
        await pc.setRemoteDescription({type: 'answer', sdp: sanitizedSdp});

        // Aus den ausstehenden IDs entfernen, falls vorhanden
        if (connectionId) {
          this.pendingConnectionIds.delete(connectionId);
        } else {
          // Falls wir über Fallback eine PC gefunden haben, versuchen wir deren ID zu finden und zu löschen
          for (const [id, p] of this.peerConnections.entries()) {
            if (p === pc) {
              this.pendingConnectionIds.delete(id);
              break;
            }
          }
        }
      } else {
        console.error(`[DEBUG_LOG] WebRTC ERROR: No matching peer connection found (ID: ${connectionId}, PendingIDs: ${Array.from(this.pendingConnectionIds).join(',')})`);
      }
    } else {
      console.error(`[DEBUG_LOG] WebRTC ERROR: Invalid answer (decompression failed)`);
    }
  }

  // CLIENT Side
  async createAnswer(compressedOffer: string): Promise<{ answer: string, roomId: string }> {
    console.warn(`[DEBUG_LOG] WebRTC: Creating answer...`);

    // In manchen Fällen werden Leerzeichen in '+' umgewandelt oder umgekehrt,
    // was die Dekomprimierung behindern kann.
    let offerPacketString = LZString.decompressFromEncodedURIComponent(compressedOffer.trim());

    if (!offerPacketString) {
      console.warn("[DEBUG_LOG] WebRTC: Decompression failed for offer! Attempting recovery...");
      // Falls der String falsch URL-codiert war (z.B. Leerzeichen statt +)
      const sanitized = compressedOffer.trim().replace(/ /g, '+');
      offerPacketString = LZString.decompressFromEncodedURIComponent(sanitized);
    }

    if (!offerPacketString) {
      throw new Error("Invalid offer (decompression failed)");
    }

    const packet = JSON.parse(offerPacketString);
    let sdpOffer = packet.sdp;

    // SDP muss mit CRLF enden und darf keine fehlerhaften Endungen haben
    if (sdpOffer && !sdpOffer.endsWith('\n')) {
      sdpOffer += '\r\n';
    }

    const roomId = packet.roomId || "P2P-Room";
    const connectionId = packet.connectionId || Math.random().toString(36).substring(2, 9);

    console.warn(`[DEBUG_LOG] WebRTC: Offer received for room ${roomId}, connectionId: ${connectionId}`);

    const pc = this.initPeerConnection(connectionId);

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      console.warn(`[DEBUG_LOG] WebRTC: Data channel received from host (${connectionId})`);
      this.setupDataChannel(dc, connectionId);
    };

    try {
      // Sicherstellen, dass SDP korrekt formatiert ist (CRLF)
      const sanitizedSdp = sdpOffer.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0).join('\r\n') + '\r\n';

      await pc.setRemoteDescription({type: 'offer', sdp: sanitizedSdp});
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait for ICE gathering
      await this.waitForIceGathering(pc);

      const sdp = pc.localDescription!.sdp;
      const normalizedAnswerSdp = sdp.split('\n').map(line => line.trim()).join('\r\n') + '\r\n';

      console.warn(`[DEBUG_LOG] WebRTC: Answer SDP generated (length: ${normalizedAnswerSdp.length}) for connectionId: ${connectionId}`);
      const answerPacket = {sdp: normalizedAnswerSdp, connectionId};
      const answerCompressed = LZString.compressToEncodedURIComponent(JSON.stringify(answerPacket));
      return {answer: answerCompressed, roomId};
    } catch (err: any) {
      console.error(`[DEBUG_LOG] WebRTC: SDP Error: ${err.message}`);
      throw err;
    }
  }

  async generateQRCode(text: string): Promise<string> {
    return await QRCode.toDataURL(text);
  }

  sendMessage(data: any) {
    this.dataChannels.forEach((dc, id) => {
      if (dc.readyState === 'open') {
        dc.send(JSON.stringify(data));
      }
    });
  }

  public closeAllConnections() {
    console.warn(`[DEBUG_LOG] WebRTC: Closing all ${this.peerConnections.size} connections`);
    this.dataChannels.forEach(dc => dc.close());
    this.peerConnections.forEach(pc => pc.close());
    this.dataChannels.clear();
    this.peerConnections.clear();
    this.individualStatus.forEach(status => status.set('disconnected'));
    this.individualStatus.clear();
    this.activeConnections.set([]);
    this.connectionStatus.set('disconnected');
    this.pendingConnectionIds.clear();
  }

  private async waitForIceGathering(pc: RTCPeerConnection) {
    console.warn("[DEBUG_LOG] WebRTC: Waiting for ICE gathering...");
    const isLocal = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
    const timeoutMs = isLocal ? 500 : 5000; // Viel kürzer auf localhost

    await new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') {
        console.warn("[DEBUG_LOG] WebRTC: ICE gathering already complete");
        resolve(true);
      } else {
        const checkState = () => {
          console.warn(`[DEBUG_LOG] WebRTC: ICE gathering state changed: ${pc.iceGatheringState}`);
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve(true);
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
        // Fallback: If it takes too long, just continue with what we have
        setTimeout(() => {
          console.warn(`[DEBUG_LOG] WebRTC: ICE gathering timeout (${timeoutMs}ms), continuing...`);
          resolve(true);
        }, timeoutMs);
      }
    });
  }

  private initPeerConnection(id: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.config);
    this.peerConnections.set(id, pc);

    if (!this.individualStatus.has(id)) {
      this.individualStatus.set(id, signal<'disconnected' | 'connecting' | 'connected'>('disconnected'));
    }
    const statusSignal = this.individualStatus.get(id)!;

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.warn(`[DEBUG_LOG] ICE Connection State (${id}):`, state);

      if (state === 'connected' || state === 'completed') {
        // connectionStatus signalisiert nur, dass MINDESTENS EINE Verbindung steht
        this.connectionStatus.set('connected');
        statusSignal.set('connected');
        if (!this.activeConnections().includes(id)) {
          this.activeConnections.update(prev => [...prev, id]);
        }
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        // Log explicitly for debugging
        console.warn(`[DEBUG_LOG] WebRTC State change: ${state} for ${id}`);
        statusSignal.set('disconnected');

        // Wichtig: ID aus aktiven Verbindungen und internen Maps entfernen
        this.activeConnections.update(prev => prev.filter(cid => cid !== id));
        this.peerConnections.get(id)?.close();
        this.peerConnections.delete(id);
        this.dataChannels.get(id)?.close();
        this.dataChannels.delete(id);
        this.pendingConnectionIds.delete(id);

        this.connectionDisconnected$.next(id);

        // Wir setzen den Status nur auf disconnected, wenn ALLE Verbindungen weg sind
        const allDisconnected = Array.from(this.peerConnections.values())
          .every(p => p.iceConnectionState === 'disconnected' || p.iceConnectionState === 'failed' || p.iceConnectionState === 'closed');
        if (allDisconnected) {
          this.connectionStatus.set('disconnected');
        }
      }
    };
    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel, id: string) {
    this.dataChannels.set(id, channel);
    if (!this.individualStatus.has(id)) {
      this.individualStatus.set(id, signal<'disconnected' | 'connecting' | 'connected'>('disconnected'));
    }
    const statusSignal = this.individualStatus.get(id)!;

    channel.onopen = () => {
      console.warn(`[DEBUG_LOG] DataChannel open (${id})`);
      // connectionStatus signalisiert nur, dass MINDESTENS EINE Verbindung steht
      this.pendingConnectionId.set(null);
      this.connectionStatus.set('connected');
      statusSignal.set('connected');
      if (!this.activeConnections().includes(id)) {
        this.activeConnections.update(prev => [...prev, id]);
      }
    };
    channel.onclose = () => {
      console.warn(`[DEBUG_LOG] DataChannel closed (${id})`);
      this.dataChannels.delete(id);
      this.peerConnections.get(id)?.close();
      this.peerConnections.delete(id);
      this.pendingConnectionIds.delete(id);
      this.activeConnections.update(prev => prev.filter(cid => cid !== id));
      statusSignal.set('disconnected');
      this.connectionDisconnected$.next(id);

      const allDisconnected = this.dataChannels.size === 0;
      if (allDisconnected) {
        this.connectionStatus.set('disconnected');
      }
    };
    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Wir fügen die connectionId zur Nachricht hinzu, damit der Empfänger weiß, von wem sie kommt
      data._connectionId = id;
      this.message$.next(data);
    };
  }
}

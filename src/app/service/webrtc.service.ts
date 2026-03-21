import {Injectable} from '@angular/core';
import * as QRCode from 'qrcode';
import * as LZString from 'lz-string';
import {BehaviorSubject, Subject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class WebRTCService {
  public connectionStatus = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  public individualStatus = new Map<string, BehaviorSubject<'disconnected' | 'connecting' | 'connected'>>();
  public message$ = new Subject<any>();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private pendingConnectionId: string | null = null;
  private config: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
  };

  constructor() {
  }

  /**
   * Stellt eine ausstehende Verbindung wieder her, falls die Seite neu geladen wurde.
   */
  public restorePendingConnection(id: string) {
    console.log(`[DEBUG_LOG] WebRTC: Setting pendingConnectionId to ${id}`);
    this.pendingConnectionId = id;

    if (!this.peerConnections.has(id)) {
      console.warn(`[DEBUG_LOG] WebRTC: Connection ${id} not found in peerConnections. Handshake might fail if this is a new PC.`);
    }
  }

  // HOST Side
  async createOffer(roomId: string): Promise<string> {
    console.warn(`[DEBUG_LOG] WebRTC: Creating offer for room ${roomId}`);
    const connectionId = Math.random().toString(36).substring(2, 9);
    this.pendingConnectionId = connectionId;

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

    let sdp = LZString.decompressFromEncodedURIComponent(compressedAnswer);

    if (!sdp) {
      console.warn("[DEBUG_LOG] WebRTC: Answer decompression failed! Attempting recovery...");
      const sanitized = compressedAnswer.replace(/ /g, '+');
      sdp = LZString.decompressFromEncodedURIComponent(sanitized);
    }

    if (sdp && this.pendingConnectionId) {
      console.warn(`[DEBUG_LOG] WebRTC: Answer SDP decompressed (length: ${sdp.length})`);
      const pc = this.peerConnections.get(this.pendingConnectionId);
      if (pc) {
        console.warn(`[DEBUG_LOG] WebRTC: Setting remote description for connectionId: ${this.pendingConnectionId}`);
        // Normalisiere Antwort-SDP
        const sanitizedSdp = sdp.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\r\n') + '\r\n';
        await pc.setRemoteDescription({type: 'answer', sdp: sanitizedSdp});
        this.pendingConnectionId = null;
      } else {
        console.error(`[DEBUG_LOG] WebRTC ERROR: No peer connection found for ${this.pendingConnectionId}`);
      }
    } else {
      console.error(`[DEBUG_LOG] WebRTC ERROR: Invalid answer or no pending connectionId`);
    }
  }

  // CLIENT Side
  async createAnswer(compressedOffer: string): Promise<{ answer: string, roomId: string }> {
    console.warn(`[DEBUG_LOG] WebRTC: Creating answer...`);

    // In manchen Fällen werden Leerzeichen in '+' umgewandelt oder umgekehrt,
    // was die Dekomprimierung behindern kann.
    let offerPacketString = LZString.decompressFromEncodedURIComponent(compressedOffer);

    if (!offerPacketString) {
      console.warn("[DEBUG_LOG] WebRTC: Decompression failed for offer! Attempting recovery...");
      // Falls der String falsch URL-codiert war (z.B. Leerzeichen statt +)
      const sanitized = compressedOffer.replace(/ /g, '+');
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
      const answerCompressed = LZString.compressToEncodedURIComponent(normalizedAnswerSdp);
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
    this.individualStatus.forEach(status => status.next('disconnected'));
    this.individualStatus.clear();
    this.connectionStatus.next('disconnected');
    this.pendingConnectionId = null;
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
      this.individualStatus.set(id, new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected'));
    }
    const statusSubject = this.individualStatus.get(id)!;

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.warn(`[DEBUG_LOG] ICE Connection State (${id}):`, state);

      if (state === 'connected' || state === 'completed') {
        this.connectionStatus.next('connected');
        statusSubject.next('connected');
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        // Log explicitly for debugging
        console.warn(`[DEBUG_LOG] WebRTC State change: ${state} for ${id}`);
        statusSubject.next('disconnected');

        // Wir setzen den Status nur auf disconnected, wenn ALLE Verbindungen weg sind
        const allDisconnected = Array.from(this.peerConnections.values())
          .every(p => p.iceConnectionState === 'disconnected' || p.iceConnectionState === 'failed' || p.iceConnectionState === 'closed');
        if (allDisconnected) {
          this.connectionStatus.next('disconnected');
        }
      }
    };
    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel, id: string) {
    this.dataChannels.set(id, channel);
    if (!this.individualStatus.has(id)) {
      this.individualStatus.set(id, new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected'));
    }
    const statusSubject = this.individualStatus.get(id)!;

    channel.onopen = () => {
      console.warn(`[DEBUG_LOG] DataChannel open (${id})`);
      this.connectionStatus.next('connected');
      statusSubject.next('connected');
    };
    channel.onclose = () => {
      console.warn(`[DEBUG_LOG] DataChannel closed (${id})`);
      this.dataChannels.delete(id);
      this.peerConnections.delete(id);
      statusSubject.next('disconnected');

      const allDisconnected = this.dataChannels.size === 0;
      if (allDisconnected) {
        this.connectionStatus.next('disconnected');
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

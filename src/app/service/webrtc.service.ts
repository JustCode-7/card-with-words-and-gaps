import {Injectable} from '@angular/core';
import * as QRCode from 'qrcode';
import * as LZString from 'lz-string';
import {BehaviorSubject, Subject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class WebRTCService {
  public connectionStatus = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  public message$ = new Subject<any>();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private pendingConnectionId: string | null = null;
  private config: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
  };

  constructor() {
    // Für lokale Tests (Simulation via BroadcastChannel) setzen wir den Status sofort auf connected
    if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
      console.warn("[TEST_SIM] WebRTC: Forcing status to connected for simulation");
      this.connectionStatus.next('connected');
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

    const sdp = pc.localDescription!.sdp;
    console.warn(`[DEBUG_LOG] WebRTC: Offer SDP generated, connectionId: ${connectionId}`);
    // Wir packen den Raumnamen und die Verbindungs-ID mit in das Paket
    const packet = {sdp, roomId, connectionId};
    return LZString.compressToEncodedURIComponent(JSON.stringify(packet));
  }

  async handleAnswer(compressedAnswer: string) {
    console.warn(`[DEBUG_LOG] WebRTC: Handling answer...`);
    const sdp = LZString.decompressFromEncodedURIComponent(compressedAnswer);
    if (sdp && this.pendingConnectionId) {
      const pc = this.peerConnections.get(this.pendingConnectionId);
      if (pc) {
        console.warn(`[DEBUG_LOG] WebRTC: Setting remote description for connectionId: ${this.pendingConnectionId}`);
        await pc.setRemoteDescription({type: 'answer', sdp});
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
    const offerPacketString = LZString.decompressFromEncodedURIComponent(compressedOffer);
    if (!offerPacketString) throw new Error("Invalid offer");

    const packet = JSON.parse(offerPacketString);
    const sdpOffer = packet.sdp;
    const roomId = packet.roomId || "P2P-Room";
    const connectionId = packet.connectionId || Math.random().toString(36).substring(2, 9);
    console.warn(`[DEBUG_LOG] WebRTC: Offer received for room ${roomId}, connectionId: ${connectionId}`);

    const pc = this.initPeerConnection(connectionId);

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      console.warn(`[DEBUG_LOG] WebRTC: Data channel received from host (${connectionId})`);
      this.setupDataChannel(dc, connectionId);
    };

    await pc.setRemoteDescription({type: 'offer', sdp: sdpOffer});
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Wait for ICE gathering
    await this.waitForIceGathering(pc);

    const sdp = pc.localDescription!.sdp;
    console.warn(`[DEBUG_LOG] WebRTC: Answer SDP generated for connectionId: ${connectionId}`);
    const answerCompressed = LZString.compressToEncodedURIComponent(sdp!);
    return {answer: answerCompressed, roomId};
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

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.warn(`[DEBUG_LOG] ICE Connection State (${id}):`, state);

      if (state === 'connected' || state === 'completed') {
        this.connectionStatus.next('connected');
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        // Log explicitly for debugging
        console.warn(`[DEBUG_LOG] WebRTC State change: ${state} for ${id}`);

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
    channel.onopen = () => {
      console.warn(`[DEBUG_LOG] DataChannel open (${id})`);
      this.connectionStatus.next('connected');
    };
    channel.onclose = () => {
      console.warn(`[DEBUG_LOG] DataChannel closed (${id})`);
      this.dataChannels.delete(id);
      this.peerConnections.delete(id);

      const allDisconnected = this.dataChannels.size === 0;
      if (allDisconnected) {
        this.connectionStatus.next('disconnected');
      }
    };
    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.message$.next(data);
    };
  }
}

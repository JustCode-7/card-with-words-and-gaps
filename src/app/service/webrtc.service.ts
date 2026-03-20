import {Injectable} from '@angular/core';
import * as QRCode from 'qrcode';
import * as LZString from 'lz-string';
import {BehaviorSubject, Subject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class WebRTCService {
  public connectionStatus = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  public message$ = new Subject<any>();
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
  };

  constructor() {
  }

  // HOST Side
  async createOffer(roomId: string): Promise<string> {
    this.initPeerConnection();
    this.dataChannel = this.peerConnection!.createDataChannel("game-data");
    this.setupDataChannel(this.dataChannel);

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    // Wait for ICE gathering
    await this.waitForIceGathering();

    const sdp = this.peerConnection!.localDescription!.sdp;
    // Wir packen den Raumnamen mit in das Paket
    const packet = {sdp, roomId};
    return LZString.compressToEncodedURIComponent(JSON.stringify(packet));
  }

  async handleAnswer(compressedAnswer: string) {
    if (!this.peerConnection) return;
    const sdp = LZString.decompressFromEncodedURIComponent(compressedAnswer);
    if (sdp) {
      await this.peerConnection.setRemoteDescription({type: 'answer', sdp});
    }
  }

  // CLIENT Side
  async createAnswer(compressedOffer: string): Promise<{ answer: string, roomId: string }> {
    this.initPeerConnection();

    this.peerConnection!.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);
    };

    const offerPacketString = LZString.decompressFromEncodedURIComponent(compressedOffer);
    if (!offerPacketString) throw new Error("Invalid offer");

    const packet = JSON.parse(offerPacketString);
    const sdpOffer = packet.sdp;
    const roomId = packet.roomId || "P2P-Room";

    await this.peerConnection!.setRemoteDescription({type: 'offer', sdp: sdpOffer});
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    // Wait for ICE gathering
    await this.waitForIceGathering();

    const sdp = this.peerConnection!.localDescription!.sdp;
    const answerCompressed = LZString.compressToEncodedURIComponent(sdp!);
    return {answer: answerCompressed, roomId};
  }

  async generateQRCode(text: string): Promise<string> {
    return await QRCode.toDataURL(text);
  }

  sendMessage(data: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  private async waitForIceGathering() {
    await new Promise(resolve => {
      if (this.peerConnection!.iceGatheringState === 'complete') {
        resolve(true);
      } else {
        const checkState = () => {
          if (this.peerConnection!.iceGatheringState === 'complete') {
            this.peerConnection!.removeEventListener('icegatheringstatechange', checkState);
            resolve(true);
          }
        };
        this.peerConnection!.addEventListener('icegatheringstatechange', checkState);
        setTimeout(() => resolve(true), 2000);
      }
    });
  }

  private initPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.config);

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('ICE Connection State:', state);

      if (state === 'connected' || state === 'completed') {
        this.connectionStatus.next('connected');
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        // Bei 'disconnected' oder 'failed' versuchen wir nicht sofort abzubrechen,
        // da ICE manchmal kurzzeitig die Verbindung verliert und wiederfindet.
        if (state === 'failed') {
          console.error("WebRTC: ICE failed. Verbindung konnte nicht hergestellt werden.");
          this.connectionStatus.next('disconnected');
        } else {
          this.connectionStatus.next('disconnected');
        }
      }
    };
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log("DataChannel open");
      this.connectionStatus.next('connected');
    };
    channel.onclose = () => {
      console.log("DataChannel closed");
      this.connectionStatus.next('disconnected');
    };
    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.message$.next(data);
    };
  }
}

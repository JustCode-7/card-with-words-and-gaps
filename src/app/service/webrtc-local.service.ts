import * as LZString from 'lz-string';
import * as QRCode from 'qrcode';
import {WebRTCBaseService} from './webrtc-base.service';
import {WebRTCMode} from './webrtc.types';
import {Injectable} from "@angular/core";

@Injectable({providedIn: 'root'})
export class WebRTCLocalLogic {
  constructor(private service: WebRTCBaseService) {
  }

  async createOffer(roomId: string): Promise<string> {
    this.service.mode.set(WebRTCMode.LOCAL);
    console.warn(`[DEBUG_LOG] WebRTC-Local: Creating offer for room ${roomId}`);
    const connectionId = Math.random().toString(36).substring(2, 9);
    (this.service as any).pendingConnectionIds.add(connectionId);

    const pc = (this.service as any).initPeerConnection(connectionId);
    const dc = pc.createDataChannel("game-data");
    (this.service as any).setupDataChannel(dc, connectionId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await (this.service as any).waitForIceGathering(pc);

    let sdp = pc.localDescription!.sdp;
    const optimizedSdp = (this.service as any).optimizeSdp(sdp);

    console.warn(`[DEBUG_LOG] WebRTC-Local: Offer SDP generated, connectionId: ${connectionId}`);

    const packet = {sdp: optimizedSdp, roomId, connectionId};
    return LZString.compressToEncodedURIComponent(JSON.stringify(packet));
  }

  async handleAnswer(compressedAnswer: string) {
    console.warn(`[DEBUG_LOG] WebRTC-Local: Handling answer...`);
    let decompressed = LZString.decompressFromEncodedURIComponent(compressedAnswer.trim());

    if (!decompressed) {
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
        pc = this.service.peerConnections.get(connectionId);
        this.service.individualStatus.get(connectionId)?.set({state: 'connecting', type: 'unknown'});
      }

      const pendingIds = (this.service as any).pendingConnectionIds as Set<string>;
      if (!pc && pendingIds.size > 0) {
        if (pendingIds.size === 1) {
          const id = Array.from(pendingIds)[0];
          pc = this.service.peerConnections.get(id);
        } else if (connectionId && pendingIds.has(connectionId)) {
          pc = this.service.peerConnections.get(connectionId);
        }
      }

      if (!pc && this.service.peerConnections.size === 1) {
        pc = Array.from(this.service.peerConnections.values())[0];
      }

      if (pc && sdp) {
        if (pc.signalingState !== 'have-local-offer' && pc.signalingState !== 'stable') {
          console.warn(`[DEBUG_LOG] WebRTC-Local: Cannot set remote answer in state ${pc.signalingState}.`);
          return;
        }

        const sanitizedSdp = (this.service as any).optimizeSdp(sdp);
        await pc.setRemoteDescription({type: 'answer', sdp: sanitizedSdp});

        if (connectionId) {
          pendingIds.delete(connectionId);
        } else {
          for (const [id, p] of this.service.peerConnections.entries()) {
            if (p === pc) {
              pendingIds.delete(id);
              break;
            }
          }
        }
      } else {
        console.error(`[DEBUG_LOG] WebRTC-Local ERROR: No matching peer connection found.`);
      }
    }
  }

  async createAnswer(compressedOffer: string): Promise<{ answer: string, roomId: string }> {
    this.service.mode.set(WebRTCMode.LOCAL);
    console.warn(`[DEBUG_LOG] WebRTC-Local: Creating answer...`);

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

    const pc = (this.service as any).initPeerConnection(connectionId);
    pc.ondatachannel = (event: any) => {
      (this.service as any).setupDataChannel(event.channel, connectionId);
    };

    try {
      const sanitizedSdp = (this.service as any).optimizeSdp(sdpOffer);
      await pc.setRemoteDescription({type: 'offer', sdp: sanitizedSdp});

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await (this.service as any).waitForIceGathering(pc);

      const optimizedAnswerSdp = (this.service as any).optimizeSdp(pc.localDescription!.sdp);
      const answerPacket = {sdp: optimizedAnswerSdp, connectionId};
      const answerCompressed = LZString.compressToEncodedURIComponent(JSON.stringify(answerPacket));

      return {answer: answerCompressed, roomId};
    } catch (err: any) {
      console.error(`[DEBUG_LOG] WebRTC-Local: SDP Error: ${err.message}`);
      throw err;
    }
  }

  async generateQRCode(text: string): Promise<string> {
    return await QRCode.toDataURL(text);
  }
}

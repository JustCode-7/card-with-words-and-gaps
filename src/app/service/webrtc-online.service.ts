import {Database, get, onValue, ref, remove, serverTimestamp, set} from '@angular/fire/database';
import * as LZString from 'lz-string';
import {WebRTCBaseService} from './webrtc-base.service';
import {FireRoom, WebRTCMode} from './webrtc.types';
import {HostListener, Injectable} from "@angular/core";

@Injectable({providedIn: 'root'})
export class WebRTCOnlineLogic {
  private firebaseRoomRefs: Map<string, string> = new Map();
  private _firebaseUnsubscribe: (() => void) | null = null;

  constructor(private service: WebRTCBaseService, private db: Database) {
  }

  @HostListener('window:beforeunload')
  async onDeleteRoom() {
    if (this.service.p2pRoomId()) {
      const roomRef = ref(this.db, `rooms/${this.service.p2pRoomId()}`);
      await remove(roomRef);
    }
  }

  async startOnlineHosting(roomName: string): Promise<string> {
    this.service.mode.set(WebRTCMode.ONLINE);
    this.service.onlineHostingActive.set(true);
    console.warn(`[DEBUG_LOG] WebRTC-Online: Starting hosting for room ${roomName}`);

    const masterConnectionId = "master-" + Math.random().toString(36).substring(2, 5);
    const pc_master = (this.service as any).initPeerConnection(masterConnectionId);
    pc_master.createDataChannel("game-data");

    const offer = await pc_master.createOffer();
    await pc_master.setLocalDescription(offer);

    // Host-ICE-Gathering: Wir warten länger, um sicherzustellen, dass wir Kandidaten haben.
    await (this.service as any).waitForIceGathering(pc_master, 3000);

    const optimizedSdp = (this.service as any).optimizeSdp(pc_master.localDescription!.sdp);
    const compressedOffer = LZString.compressToEncodedURIComponent(optimizedSdp);

    (this.service as any).cleanupConnection(masterConnectionId);

    const logicId = "HOST_ROOM_LOGIC";
    this.firebaseRoomRefs.set(logicId, roomName);
    this.service.p2pRoomId.set(roomName); // Host RoomID setzen

    const roomRef = ref(this.db, `rooms/${roomName}`);
    const fireRoom: FireRoom = {
      hostOffer: compressedOffer,
      roomId: roomName, // roomId hinzufügen für SocketService
      createdAt: serverTimestamp(),
      status: 'waiting'
    };

    try {
      await set(roomRef, fireRoom);
      console.warn(`[DEBUG_LOG] WebRTC-Online: Room ${roomName} created in Firebase.`);

      const answersRef = ref(this.db, `rooms/${roomName}/answers`);
      this._firebaseUnsubscribe = onValue(answersRef, async (snapshot) => {
        const answers = snapshot.val() as Record<string, string>;
        if (!answers) return;

        for (const clientId in answers) {
          if (clientId.endsWith("_host")) continue; // Skip host-offers stored in the answers node
          if (this.service.peerConnections.has(clientId)) continue;

          console.warn(`[DEBUG_LOG] WebRTC-Online: New client ${clientId} found.`);
          const compressedAnswer = answers[clientId];
          const decompressedAnswer = LZString.decompressFromEncodedURIComponent(compressedAnswer);

          if (decompressedAnswer) {
            // WICHTIG: Im Online-Modus fungiert der Host als "Caller".
            // Wir erstellen für JEDEN Client ein frisches Offer, genau wie im lokalen Modus.
            try {
              console.warn(`[DEBUG_LOG] WebRTC-Online: Starting handshake for client ${clientId}`);

              const pc = (this.service as any).initPeerConnection(clientId);
              const dc = pc.createDataChannel("game-data");
              (this.service as any).setupDataChannel(dc, clientId);

              // 1. Initialisiere den Caller-Zustand durch createOffer
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);

              // 2. Warte auf ICE (optional, aber stabiler)
              await (this.service as any).waitForIceGathering(pc, 2000);
              const freshOptimizedSdp = (this.service as any).optimizeSdp(pc.localDescription!.sdp);

              // 3. Setze die Antwort des Clients als Remote Description
              await pc.setRemoteDescription({type: 'answer', sdp: decompressedAnswer});

              // WICHTIG: Sende dem Client das FRISCHE Offer mit den ICE-Kandidaten des Hosts zurück
              // (Der Client muss wissen, wie er den Host erreicht)
              const answerRef = ref(this.db, `rooms/${roomName}/answers/${clientId}_host`);
              await set(answerRef, LZString.compressToEncodedURIComponent(freshOptimizedSdp));

              console.warn(`[DEBUG_LOG] WebRTC-Online: Handshake for client ${clientId} completed.`);
            } catch (e) {
              console.error(`[DEBUG_LOG] WebRTC-Online: Failed handshake for client ${clientId}`, e);
              (this.service as any).cleanupConnection(clientId);
            }
          }
        }
      }, (error) => {
        console.error("Firebase onValue error", error);
        this.service.error$.next("Fehler beim Abonnieren des Raums (Firebase)");
      });

      return logicId;

    } catch (error) {
      console.error("[DEBUG_LOG] WebRTC-Online: Firebase write failed", error);
      throw new Error("Raum konnte nicht erstellt werden");
    }
  }

  async joinOnlineRoom(roomName: string): Promise<string> {
    this.service.mode.set(WebRTCMode.ONLINE);
    console.warn(`[DEBUG_LOG] WebRTC-Online: Joining room ${roomName}`);
    const roomRef = ref(this.db, `rooms/${roomName}`);

    try {
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) throw new Error("Raum abgelaufen oder existiert nicht");

      const data = snapshot.val() as FireRoom;
      const decompressedOffer = LZString.decompressFromEncodedURIComponent(data.hostOffer!);
      if (!decompressedOffer) throw new Error("Invalid offer in Firebase");

      const roomId = data.roomId || roomName;
      this.service.p2pRoomId.set(roomId); // RoomID im Service synchronisieren

      const connectionId = "client-" + Math.random().toString(36).substring(2, 9);
      const pc = (this.service as any).initPeerConnection(connectionId);

      pc.ondatachannel = (event: any) => {
        (this.service as any).setupDataChannel(event.channel, connectionId);
      };

      await pc.setRemoteDescription({type: 'offer', sdp: decompressedOffer});
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await (this.service as any).waitForIceGathering(pc, 2000);

      const optimizedAnswerSdp = (this.service as any).optimizeSdp(pc.localDescription!.sdp);
      const compressedAnswer = LZString.compressToEncodedURIComponent(optimizedAnswerSdp);

      const answerRef = ref(this.db, `rooms/${roomName}/answers/${connectionId}`);
      await set(answerRef, compressedAnswer);

      // 4. Warte auf das spezifische Host-Offer für diesen Client
      const hostOfferRef = ref(this.db, `rooms/${roomName}/answers/${connectionId}_host`);
      onValue(hostOfferRef, async (snapshot) => {
        const compressedHostOffer = snapshot.val();
        if (compressedHostOffer) {
          const decompressedHostOffer = LZString.decompressFromEncodedURIComponent(compressedHostOffer);
          if (decompressedHostOffer) {
            console.warn(`[DEBUG_LOG] WebRTC-Online: Updating Host-Offer for ${connectionId}`);
            try {
              await pc.setRemoteDescription({type: 'offer', sdp: decompressedHostOffer});
              const updateAnswer = await pc.createAnswer();
              await pc.setLocalDescription(updateAnswer);
              console.warn(`[DEBUG_LOG] WebRTC-Online: Client state stable for ${connectionId}`);
            } catch (e) {
              console.error(`[DEBUG_LOG] WebRTC-Online: Failed to update Host-Offer for ${connectionId}`, e);
            }
          }
        }
      });

      return connectionId;
    } catch (error: any) {
      console.error("[DEBUG_LOG] WebRTC-Online: Join failed", error);
      throw error;
    }
  }

  onBeforeCleanup(id: string) {
    const roomName = this.firebaseRoomRefs.get(id);
    if (roomName) {
      if (id === "HOST_ROOM_LOGIC") {
        console.warn(`[DEBUG_LOG] WebRTC-Online: Terminating hosting for room ${roomName}`);
        this.service.onlineHostingActive.set(false);
        const roomRef = ref(this.db, `rooms/${roomName}`);
        remove(roomRef).catch(e => console.error("Firebase cleanup for room failed", e));

        if (this._firebaseUnsubscribe) {
          this._firebaseUnsubscribe();
          this._firebaseUnsubscribe = null;
        }
      }
      this.firebaseRoomRefs.delete(id);
    }
  }
}

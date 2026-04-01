import {signal, WritableSignal} from '@angular/core';
import {Subject} from 'rxjs';
import {ConnectionType, PeerStatus, WebRTCMode} from './webrtc.types';

export abstract class WebRTCBaseService {
  public mode = signal<WebRTCMode>(WebRTCMode.LOCAL);
  public onlineHostingActive = signal(false);
  public connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  public p2pRoomId = signal<string | null>(null);
  public individualStatus = new Map<string, WritableSignal<PeerStatus>>();
  public activeConnections = signal<string[]>([]);
  public message$ = new Subject<any>();
  public error$ = new Subject<string>();
  public connectionDisconnected$ = new Subject<string>();

  public peerConnections: Map<string, RTCPeerConnection> = new Map();
  public pendingConnectionId = signal<string | null>(null);

  dataChannels: Map<string, RTCDataChannel> = new Map();
  protected pendingConnectionIds: Set<string> = new Set();

  protected config: RTCConfiguration = {
    iceServers: [
      {urls: 'stun:stun.l.google.com:19302'},
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turns:openrelay.metered.ca:443?transport=tcp'
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  protected readonly MAX_BUFFER_SIZE = 16 * 1024 * 1024;

  public restorePendingConnection(id: string) {
    console.log(`[DEBUG_LOG] WebRTC: Adding ${id} to pendingConnectionIds`);
    this.pendingConnectionIds.add(id);

    if (!this.peerConnections.has(id)) {
      console.warn(`[DEBUG_LOG] WebRTC: Connection ${id} not found in peerConnections.`);
    }
  }

  public sendMessage(data: any) {
    const payload = JSON.stringify(data);
    this.dataChannels.forEach((dc, id) => {
      if (dc.readyState === 'open') {
        if (dc.bufferedAmount > this.MAX_BUFFER_SIZE) {
          console.warn(`[DEBUG_LOG] WebRTC: Puffer voll für ${id}. Nachricht wird ignoriert.`);
          return;
        }
        dc.send(payload);
      }
    });
  }

  public async logConnectionStats(id: string) {
    const pc = this.peerConnections.get(id);
    if (!pc) return;

    const stats = await pc.getStats();
    let detectedType: ConnectionType = 'unknown';

    (stats as any).forEach((report: any) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const local = (stats as any).get(report.localCandidateId);
        switch (local?.candidateType) {
          case 'host':
            detectedType = 'local';
            break;
          case 'srflx':
            detectedType = 'p2p';
            break;
          case 'relay':
            detectedType = 'relay';
            break;
        }
      }
    });

    const currentSignal = this.individualStatus.get(id);
    if (currentSignal) {
      currentSignal.update(prev => ({...prev, type: detectedType}));
    }
  }

  public async updateConnectionMetadata(id: string) {
    return this.logConnectionStats(id);
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

  protected async waitForIceGathering(pc: RTCPeerConnection, customTimeout?: number) {
    console.warn("[DEBUG_LOG] WebRTC: Waiting for ICE gathering...");
    const isLocal = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
    const timeoutMs = customTimeout || (isLocal ? 500 : 5000);

    await new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') {
        resolve(true);
        return;
      }

      let fastResolveTimer: any;
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') cleanupAndResolve();
      };
      const checkCandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate && (event.candidate.type === 'srflx' || event.candidate.type === 'relay')) {
          if (!fastResolveTimer) {
            fastResolveTimer = setTimeout(() => {
              console.warn("[DEBUG_LOG] WebRTC: srflx/relay Kandidat gefunden. Beschleunige.");
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
        console.warn(`[DEBUG_LOG] WebRTC: ICE gathering timeout (${timeoutMs}ms)`);
        cleanupAndResolve();
      }, timeoutMs);
    });
  }

  protected optimizeSdp(sdp: string): string {
    let lines = sdp.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    lines = lines.filter(line => {
      if (line.startsWith('a=extmap:')) return false;
      if (line.startsWith('a=msid-semantic:')) return false;
      return true;
    });
    return lines.join('\r\n') + '\r\n';
  }

  protected initPeerConnection(id: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.config);
    this.peerConnections.set(id, pc);

    pc.ondatachannel = (event) => {
      console.warn(`[DEBUG_LOG] WebRTC: DataChannel received for ${id}`);
      this.setupDataChannel(event.channel, id);
    };

    if (!this.individualStatus.has(id)) {
      this.individualStatus.set(id, signal<PeerStatus>({state: 'disconnected', type: 'unknown'}));
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      const statusSignal = this.individualStatus.get(id);
      console.warn(`[DEBUG_LOG] ICE Connection State (${id}):`, state);

      if (state === 'connected' || state === 'completed') {
        this.connectionStatus.set('connected');
        statusSignal?.update(prev => ({...prev, state: 'connected'}));
        if (!this.activeConnections().includes(id)) {
          this.activeConnections.update(prev => [...prev, id]);
        }
        setTimeout(() => this.logConnectionStats(id), 1000);
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        this.cleanupConnection(id);
      }
    };
    return pc;
  }

  protected setupDataChannel(channel: RTCDataChannel, id: string) {
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

    channel.onclose = () => this.cleanupConnection(id);

    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      data._connectionId = id;
      this.message$.next(data);
    };
  }

  protected cleanupConnection(id: string) {
    console.warn(`[DEBUG_LOG] Cleaning up connection: ${id}`);

    // Virtual hook for child classes (online logic)
    this.onBeforeCleanup(id);

    const dc = this.dataChannels.get(id);
    if (dc) {
      dc.onopen = dc.onclose = dc.onmessage = null;
      dc.close();
      this.dataChannels.delete(id);
    }

    const pc = this.peerConnections.get(id);
    if (pc) {
      pc.oniceconnectionstatechange = pc.ondatachannel = null;
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

  protected onBeforeCleanup(id: string) {
    // Override in online service
  }
}

import {inject, Injectable} from '@angular/core';
import {Database} from '@angular/fire/database';
import {WebRTCBaseService} from './webrtc-base.service';
import {WebRTCLocalLogic} from './webrtc-local.service';
import {WebRTCOnlineLogic} from './webrtc-online.service';

@Injectable({providedIn: 'root'})
export class WebRTCService extends WebRTCBaseService {
  private db = inject(Database);
  private localLogic = new WebRTCLocalLogic(this);
  private onlineLogic = new WebRTCOnlineLogic(this, this.db);

  // ONLINE Methods
  async startOnlineHosting(roomName: string): Promise<string> {
    return this.onlineLogic.startOnlineHosting(roomName);
  }

  async joinOnlineRoom(roomName: string): Promise<string> {
    return this.onlineLogic.joinOnlineRoom(roomName);
  }

  // LOCAL Methods
  async createOffer(roomId: string): Promise<string> {
    return this.localLogic.createOffer(roomId);
  }

  async handleAnswer(compressedAnswer: string) {
    return this.localLogic.handleAnswer(compressedAnswer);
  }

  async createAnswer(compressedOffer: string): Promise<{ answer: string, roomId: string }> {
    return this.localLogic.createAnswer(compressedOffer);
  }

  async generateQRCode(text: string): Promise<string> {
    return this.localLogic.generateQRCode(text);
  }

  protected override onBeforeCleanup(id: string) {
    this.onlineLogic.onBeforeCleanup(id);
  }
}

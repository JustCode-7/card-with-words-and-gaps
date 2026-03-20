import {TestBed} from '@angular/core/testing';
import {MatchService} from './match.service';
import {SocketService} from './socket.service';
import {Game} from '../model/game-model';
import {Spieler} from '../model/spieler-model';
import {BehaviorSubject, of} from 'rxjs';

describe('MatchService Integration Test', () => {
  let service: MatchService;
  let socketServiceSpy: any;

  beforeEach(() => {
    socketServiceSpy = jasmine.createSpyObj('SocketService', ['getGame', 'sendUpdateGame'], {
      isHost: new BehaviorSubject<boolean>(true)
    });

    socketServiceSpy.getGame.and.returnValue(of(new Game([], [], [], 'test-hash')));

    TestBed.configureTestingModule({
      providers: [
        MatchService,
        {provide: SocketService, useValue: socketServiceSpy}
      ]
    });
    service = TestBed.inject(MatchService);
  });

  it('should handle a full game round cycle', () => {
    // 1. Initialisierung
    const p1 = new Spieler('Alice', 0, [], [], true, false);
    const p2 = new Spieler('Bob', 0, [], [], false, false);
    const p3 = new Spieler('Charlie', 0, [], [], false, false);

    const initialGame = new Game(
      ['Black Card 1', 'Black Card 2'],
      ['White 1', 'White 2', 'White 3', 'White 4', 'White 5', 'White 6', 'White 7', 'White 8', 'White 9', 'White 10', 'White 11', 'White 12', 'White 13', 'White 14', 'White 15', 'White 16', 'White 17', 'White 18', 'White 19', 'White 20', 'White 21', 'White 22', 'White 23', 'White 24', 'White 25', 'White 26', 'White 27', 'White 28', 'White 29', 'White 30'],
      [p1, p2, p3],
      'test-hash',
      'Black Card 1',
      'WAITING_FOR_ANSWERS'
    );

    // Simuliere, dass Spieler 10 Karten haben
    initialGame.spieler.forEach(s => {
      for (let i = 0; i < 10; i++) {
        s.cards.push(initialGame.answerset.pop()!);
      }
    });

    service.game.next(initialGame);

    // 2. Antwort-Phase: Bob gibt Karte ab
    service.playerReady('Bob', ['White 30']); // Benutze eine existierende Karte aus Bobs Hand
    expect(service.game.value.spieler.find(s => s.name === 'Bob')?.ready).toBeTrue();
    expect(service.game.value.roundStatus).toBe('WAITING_FOR_ANSWERS');

    // 3. Antwort-Phase: Charlie gibt Karte ab
    service.playerReady('Charlie', ['White 20']); // Benutze eine existierende Karte aus Charlies Hand
    expect(service.game.value.roundStatus).toBe('CZAR_DECIDING');

    // 4. Urteil-Phase: Alice (Czar) wählt Bob als Gewinner
    service.selectWinner('Bob');
    expect(service.game.value.spieler.find(s => s.name === 'Bob')?.points).toBe(1);
    expect(service.game.value.roundStatus).toBe('ROUND_FINISHED');

    // 5. Rundenabschluss & Wechsel
    service.nextRound();

    const newCzar = service.game.value.spieler.find(s => s.catLord);
    expect(newCzar?.name).toBe('Bob'); // Czar rotiert im Uhrzeigersinn (Alice -> Bob)
    expect(service.game.value.roundStatus).toBe('WAITING_FOR_ANSWERS');

    // Prüfen ob Karten nachgezogen wurden (jeder sollte wieder 10 haben)
    service.game.value.spieler.forEach(s => {
      // Wenn ein Spieler eine Karte abgegeben hat (Bob, Charlie), sollte er nachgezogen haben.
      // Alice war Czar und hat keine abgegeben, sollte also immer noch 10 haben.
      expect(s.cards.length).withContext(`Player ${s.name} should have 10 cards`).toBe(10);
      expect(s.ready).toBeFalse();
      expect(s.selectedCards.length).toBe(0);
    });
  });
});

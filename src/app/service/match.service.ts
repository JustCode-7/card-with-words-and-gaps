import {inject, Injectable} from '@angular/core';
import {Game} from "../model/game-model";
import {Spieler} from "../model/spieler-model";
import {SpielerKartenService} from "./spieler-karten.service";
import {answerSet} from "../data/answer-cards";
import {BehaviorSubject, distinctUntilChanged} from "rxjs";
import {cardSet} from "../data/catlord-cards";
import {SocketService} from "./socket.service";
import {SocketEvent} from "../util/client-enums";
import {PlayerService} from "./player.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {ServerService} from "./server.service";
import {CardEditorService} from "./card-editor.service";

@Injectable({providedIn: 'root'})
export class MatchService {
  spielerKartenService: SpielerKartenService = inject(SpielerKartenService);
  socketService: SocketService = inject(SocketService);
  serverService: ServerService = inject(ServerService);
  cardEditorService: CardEditorService = inject(CardEditorService);
  game: BehaviorSubject<Game> = new BehaviorSubject<Game>(new Game([], [], [], "", "", 'WAITING_FOR_ANSWERS', false, false, false));

  // Game as signal for better reactivity in components
  gameSignal = toSignal(this.game, {initialValue: this.game.value});

  playerCount: number = 1;
  catlordName: string = "lord";
  currentCatLordCard = new BehaviorSubject<string>("");
  spielerListe: BehaviorSubject<Spieler[]> = new BehaviorSubject([new Spieler("dummy-id", "dummy", 1, [], [], false)]);
  playerService = inject(PlayerService);
  private currentCardNr: number = 1

  constructor() {
    this.listenOnEvents();
    this.listenToCardUpdates();
  }

  initMatch(roomId: string) {
    // Check if we are already in this room to avoid infinite loops or re-initialization
    // But allow re-initialization if the current game is empty or has only one player
    if (this.game.value.gameHash === roomId && this.game.value.spieler.length > 1) {
      console.log("Match already initialized with players for room:", roomId);
      return;
    }

    const isReload = !!localStorage.getItem('currentP2PRoomId');
    console.log(`[MATCH] initMatch for room ${roomId}. Reload: ${isReload}`);

    // Set player name in player service for identification
    const player = this.playerService.getPlayer();
    const playerName = player.name;

    // First, try to get an existing game for this room
    this.socketService.sendGetGame('getGame', roomId);

    // If this client is the host AND no game exists yet, initialize a new game
    if (this.socketService.isHost.value) {
      // Check immediately for persisted game to avoid unnecessary delays
      const persistedGame = this.serverService.getGame(roomId);
      if (persistedGame && persistedGame.spieler && persistedGame.spieler.length > 0) {
        console.log(`[MATCH] Found persisted game in ServerService for room ${roomId}`, persistedGame);
        this.game.next(persistedGame);
        this.socketService.joinRoom(roomId);
        return;
      }

      // Small delay to ensure server is ready to receive setGame if not found above
      setTimeout(() => {
        // Re-check after delay
        const recheckPersisted = this.serverService.getGame(roomId);
        if (recheckPersisted && recheckPersisted.spieler && recheckPersisted.spieler.length > 0) {
          console.log(`[MATCH] Found persisted game after delay for room ${roomId}`);
          this.game.next(recheckPersisted);
          this.socketService.joinRoom(roomId);
          return;
        }

        const currentGameState = this.game.value;
        if (!currentGameState.gameHash || currentGameState.spieler.length <= 1) {
          const newGame = new Game(
            [...this.cardEditorService.gaps()],
            [...this.cardEditorService.answers()],
            [new Spieler(player.id, playerName, 0, [], [], true)],
            roomId,
            "",
            'WAITING_FOR_ANSWERS',
            false,
            false,
            false
          );

          console.log("INIT new game as host (waiting):", newGame);
          this.game.next(newGame);
          this.socketService.sendGameWithRoomID('setGame', roomId, newGame);
          this.socketService.joinRoom(roomId);
        } else {
          // Even if we have a game, ensure we are in the room
          this.socketService.joinRoom(roomId);
        }
      }, 500);
    } else {
      // If we are a joining player, initialize a placeholder game state so guards pass
      // The real state will be loaded from the server via sendGetGame above
      const currentGameState = this.game.value;
      if (currentGameState.gameHash !== roomId || currentGameState.spieler.length === 0) {
        const placeholderGame = new Game(
          [],
          [],
          [new Spieler(player.id, playerName, 0, [], [], false)],
          roomId,
          "",
          'WAITING_FOR_ANSWERS',
          false,
          false,
          false
        );
        this.game.next(placeholderGame);
      }
    }

    console.log("Current game state:", this.game.value);

    // If we are the host, we are responsible for synchronizing state
    this.game.pipe(distinctUntilChanged((prev, curr) => {
      // Deep equal check for players array to avoid redundant broadcasts
      return JSON.stringify(prev) === JSON.stringify(curr);
    })).subscribe((game) => {
      // Logic to prevent broadcasting if the update came FROM the server
      if (game.spieler.length === 0 || !game.gameHash) {
        return;
      }

      // If we are the host, we are responsible for synchronizing state
      if (this.socketService.isHost.value) {
        console.log("Host broadcasting game update:", game);
        this.socketService.sendUpdateGame('updateGame', game);
      }
    })
    this.socketService.getGame()
      .subscribe((gameFromServer) => {
        if (!gameFromServer) {
          return;
        }
        // Wenn wir der Host sind und das Spiel vom Server (oder lokalem Speicher) leer ist, ignorieren wir es
        if (this.socketService.isHost.value && gameFromServer.spieler.length === 0) {
          return;
        }
        console.log("Updating game from server:", gameFromServer);
        this.game.next(gameFromServer);
      });

    // P2P-Updates abonnieren (um Circular Dependency zu vermeiden)
    this.socketService.p2pGameUpdate$.subscribe(game => {
      this.updateGameFromServer(game);
    });
  }

  public updateGameFromServer(game: Game) {
    if (game) {
      console.log("MatchService: updating game from server/P2P", game);
      this.game.next(game);
    }
  }

  initPlayerArr(anzahl: number, catlordname: string): Spieler[] {
    let spielerArr = [];
    // Hier nutzen wir einen Dummy-Id-Generierung oder ziehen die echten Ids (in P2P eher seltener genutzt hier)
    spielerArr.push(new Spieler("host-id", catlordname, 0, [], [], true))
    for (let i = 1; i <= anzahl; i++) {
      spielerArr.push(new Spieler("dude-id-" + i, "Dude" + i, 0, [], [], false))
    }
    this.spielerKartenService.verteileKarten(spielerArr, answerSet);
    return spielerArr;
  }

  fillSpielerCardStack() {
    // randomly fill answer cards for every player to 10
  }

  refillPlayerAnswersToTen() {
    this.spielerKartenService.verteilteKarten.map(verteilteKarten => {
      verteilteKarten.filter(value => value !== "")
        .forEach(cardString => this.removeFromCardSet(cardString))
    })
  }

  playerReady(playername: string, selectedCards: string[] = []) {
    console.log(playername + " is Ready with cards: " + selectedCards);
    const currentGame = this.game.value;
    const player = currentGame.spieler.find(p => p.id === this.socketService.getPlayerId() || p.name === playername);
    if (player) {
      player.ready = true;
      player.selectedCards = selectedCards;

      // Remove selected cards from player's hand
      player.cards = player.cards.filter(c => !selectedCards.includes(c));

      // Check if all players (except catlord) are ready
      const otherPlayers = currentGame.spieler.filter(p => !p.catLord);
      if (otherPlayers.length > 0 && otherPlayers.every(p => p.ready)) {
        currentGame.roundStatus = 'CZAR_DECIDING';
        currentGame.answersRevealed = false;
      }

      this.game.next({...currentGame});
      // Everyone needs to be able to signal they are ready
      this.socketService.sendUpdateGame('updateGame', currentGame);
    }
  }

  revealAnswers() {
    const currentGame = this.game.value;
    currentGame.answersRevealed = true;
    this.game.next({...currentGame});
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  selectWinner(winnerName: string) {
    const currentGame = this.game.value;
    const winner = currentGame.spieler.find(p => p.name === winnerName);
    if (winner) {
      winner.points += 1;
      (winner as any).isWinner = true;
      currentGame.roundStatus = 'ROUND_FINISHED';
      (currentGame as any).winnerOfLastRound = winnerName;

      // Capture all answers for the round summary
      currentGame.lastRoundAnswers = currentGame.spieler
        .filter((s: Spieler) => !s.catLord && s.ready && s.selectedCards.length > 0)
        .map((s: Spieler) => ({
          name: s.name,
          cards: s.selectedCards,
          fullText: this.buildFullText(currentGame.currentCatlordCard, s.selectedCards),
          isWinner: s.name === winnerName
        }))
        // Sort so the winner is first
        .sort((a, b) => (a.isWinner === b.isWinner) ? 0 : a.isWinner ? -1 : 1);

      const winningEntry = currentGame.lastRoundAnswers.find(a => a.isWinner);
      currentGame.lastWinnerFullText = winningEntry ? winningEntry.fullText : "";

      this.game.next({...currentGame});
      this.socketService.sendUpdateGame('updateGame', currentGame);
    }
  }

  nextRound() {
    // Only current CatLord should trigger next round
    const playerName = localStorage.getItem('playerName');
    if (!this.isPlayerCatLord(playerName || '')) {
      return;
    }

    const currentGame = this.game.value;

    // Change CatLord: if we have a winner from last round, they become CatLord
    const winnerName = (currentGame as any).winnerOfLastRound;
    if (winnerName) {
      currentGame.spieler.forEach(p => {
        p.catLord = (p.name === winnerName);
        (p as any).isWinner = false;
      });
      delete (currentGame as any).winnerOfLastRound;
    } else {
      this.changeCatLord();
    }

    // Reset player readiness, cards revealed and refill cards
    currentGame.answersRevealed = false;
    currentGame.spieler.forEach(p => {
      p.ready = false;
      p.selectedCards = [];
      // Refill to 10
      while (p.cards.length < 10 && currentGame.answerset.length > 0) {
        const index = Math.floor(Math.random() * currentGame.answerset.length);
        const card = currentGame.answerset.splice(index, 1)[0];
        p.cards.push(card);
      }
    });

    // Pick new black card
    if (currentGame.cardset.length > 0) {
      const index = Math.floor(Math.random() * currentGame.cardset.length);
      currentGame.currentCatlordCard = currentGame.cardset.splice(index, 1)[0];
    } else {
      // Game Over? Or reset cardset
      currentGame.currentCatlordCard = "Alle Karten wurden gespielt!";
    }

    currentGame.roundStatus = 'WAITING_FOR_ANSWERS';
    this.game.next({...currentGame});
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  generateRandomCardNummber(cardSet: string[]) {
    this.currentCardNr = parseInt((Math.random() * cardSet.length - 1).toFixed());
    return this.currentCardNr;
  }

  /**
   * @deprecated Use nextRound() instead for the full round transition logic.
   */
  nextCard() {
    // Get the current game state
    const currentGame = this.game.value;
    const catloardCardset = [...currentGame.cardset]; // Create a copy to avoid modifying the original

    if (catloardCardset.length < 1) {
      return;
    }

    // Remove the current card from the set
    if (this.currentCardNr >= 0 && this.currentCardNr < catloardCardset.length) {
      catloardCardset.splice(this.currentCardNr, 1);
    }

    // Select a new card using a deterministic method (based on timestamp)
    // This ensures all players will get the same card
    const timestamp = Date.now();
    const cardNumber = timestamp % catloardCardset.length;
    this.currentCardNr = cardNumber;

    // Make sure we have a valid card
    if (catloardCardset[this.currentCardNr] === undefined) {
      this.currentCardNr = 0; // Default to first card if invalid
    }

    // Update the current card
    const newCard = catloardCardset[this.currentCardNr];
    this.currentCatLordCard.next(newCard);

    // Update the game state with the new card
    currentGame.currentCatlordCard = newCard;
    currentGame.cardset = catloardCardset;

    // Change the catlord
    this.changeCatLord();

    // Broadcast the updated game state to all players
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  changeCatLord() {
    const players = this.game.value.spieler;
    const currentCzarIndex = players.findIndex(p => p.catLord);

    if (currentCzarIndex !== -1) {
      players[currentCzarIndex].catLord = false;
      const nextCzarIndex = (currentCzarIndex + 1) % players.length;
      players[nextCzarIndex].catLord = true;
    }
  }

  initIoConnection(): void {
    this.listenOnEvents()
  }

  getCurrentCatLord(): Spieler | undefined {
    return this.game.value.spieler.find(player => player.catLord);
  }

  isPlayerCatLord(playername: string): boolean {
    const currentCatLord = this.getCurrentCatLord();
    return currentCatLord?.name === playername;
  }

  createRoom(creatorName: string): string {
    const roomId = this.generateRoomId();
    const initialPlayers = this.initPlayerArr(0, creatorName);
    const newGame = new Game(cardSet, [], initialPlayers, roomId, "", 'WAITING_FOR_ANSWERS', false, false, false);
    this.game.next(newGame);
    return roomId;
  }

  endGame() {
    const currentGame = this.game.value;
    currentGame.isEnded = true;
    this.game.next({...currentGame});
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  joinRoom(roomId: string, playerName: string): boolean {
    const currentGame = this.game.value;
    if (currentGame.gameHash !== roomId) {
      return false;
    }

    // Check if player already exists
    const existingPlayer = currentGame.spieler.find(p => p.id === this.socketService.getPlayerId() || p.name === playerName);
    if (existingPlayer) {
      return true; // Player rejoining
    }

    // Add new player
    const playerInfo = this.playerService.getPlayer();
    const newPlayer = new Spieler(playerInfo.id, playerName, 0, [], [], false);
    currentGame.spieler.push(newPlayer);
    this.spielerKartenService.verteileKarten([newPlayer], answerSet);
    this.game.next({...currentGame});
    return true;
  }

  startGame() {
    // Only host should trigger start
    if (!this.socketService.isHost.value) {
      console.warn("[DEBUG_LOG] Only host can start game!");
      return;
    }
    const currentGame = this.game.value;
    if (!currentGame || !currentGame.gameHash) {
      console.warn("[DEBUG_LOG] Game state or hash missing!");
      return;
    }

    // Min 2 players to start
    if (currentGame.spieler.length < 2) {
      console.warn("[DEBUG_LOG] Not enough players to start game!");
      return;
    }

    // If already started, do nothing
    if (currentGame.isStarted) {
      console.warn("[DEBUG_LOG] Game already started!");
      return;
    }

    console.log("[DEBUG_LOG] Starting game. Current players:", currentGame.spieler.map(s => ({
      name: s.name,
      cards: s.cards.length
    })));

    // Initialize all players' cards before starting
    currentGame.spieler.forEach(s => {
      // Deal 10 cards to each player
      const cardsToDeal = 10 - s.cards.length;
      if (cardsToDeal > 0 && currentGame.answerset.length >= cardsToDeal) {
        const newCards = currentGame.answerset.splice(0, cardsToDeal);
        s.cards.push(...newCards);
        console.log(`[DEBUG_LOG] Host: Dealt ${newCards.length} cards to ${s.name}. Total: ${s.cards.length}`);
      }
    });

    const initialCard = this.getRandomCurrentCatlordCard();
    currentGame.currentCatlordCard = initialCard;

    // Remove the selected card from cardset
    currentGame.cardset = currentGame.cardset.filter(c => c !== initialCard);
    currentGame.roundStatus = 'WAITING_FOR_ANSWERS';
    currentGame.isStarted = true;
    currentGame.isEnded = false;

    // Broadcast updated game state
    console.log("[DEBUG_LOG] Host: Broadcasting started game state to all players...");
    this.game.next({...currentGame});
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  private listenToCardUpdates() {
    this.cardEditorService.cardsUpdated$.subscribe(() => {
      if (this.socketService.isHost.value) {
        const currentGame = this.game.value;
        if (currentGame && currentGame.gameHash) {
          console.log("[MATCH] Cards updated in editor, updating active game sets.");

          // Wir aktualisieren die Sets, behalten aber bereits im Spiel befindliche Karten bei,
          // falls wir eine feinere Logik wollten. Hier ersetzen wir einfach die Vorräte.
          currentGame.cardset = [...this.cardEditorService.gaps()];
          currentGame.answerset = [...this.cardEditorService.answers()];

          // Wir müssen sicherstellen, dass bereits verteilte Karten nicht doppelt vorkommen
          // oder dass wir nicht Karten entfernen, die gerade gebraucht werden.
          // Da cardset/answerset im Game-Objekt als "Nachschub" dienen, ist das Ersetzen
          // der einfachste Weg.

          this.game.next(currentGame);
          this.socketService.sendUpdateGame('updateGame', currentGame);
        }
      }
    });
  }

  private buildFullText(gapText: string, answers: string[]): string {
    let result = gapText;
    answers.forEach(answer => {
      if (gapText.includes('___')) {
        result = result.replace('___', `[${answer}]`);
      } else {
        result = result.concat(` [${answer}]`);
      }
    });
    return result;
  }

  private removeFromCardSet(cardString: string) {
    //TODO: tempArr mit dem AnswerCards im Spiel,
    // vergleichen und nicht vorhandene auff&#252;llen.
    // Wenn keine mehr da, gespielte Karten mischen und neu mverteilen
    console.log(cardString);
  }

  private getRandomCurrentCatlordCard() {
    const game = this.game.value;
    if (game.cardset.length === 0) return "";
    const index = Math.floor(Math.random() * game.cardset.length);
    const initialCard = game.cardset.splice(index, 1)[0];
    this.currentCatLordCard.next(initialCard);
    return initialCard;
  }

  private listenOnEvents(): void {

    this.socketService.onEvent(SocketEvent.CONNECT)
      .subscribe(() => {
        console.log('connected');
      });

    this.socketService.onEvent(SocketEvent.RECONNECT)
      .subscribe(() => {
        console.log('reconnection');
      });

    this.socketService.onEvent(SocketEvent.DISCONNECT)
      .subscribe(() => {
        console.log('disconnected');
      });
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

import {inject, Injectable, signal} from '@angular/core';
import {Game} from "../model/game-model";
import {Spieler} from "../model/spieler-model";
import {SpielerKartenService} from "./spieler-karten.service";
import {answerSet} from "../data/answer-cards";
import {cardSet} from "../data/catlord-cards";
import {SocketService} from "./socket.service";
import {SocketEvent} from "../util/client-enums";
import {PlayerService} from "./player.service";
import {ServerService} from "./server.service";
import {CardEditorService} from "./card-editor.service";

@Injectable({providedIn: 'root'})
export class MatchService {
  spielerKartenService: SpielerKartenService = inject(SpielerKartenService);
  socketService: SocketService = inject(SocketService);
  serverService: ServerService = inject(ServerService);
  cardEditorService: CardEditorService = inject(CardEditorService);
  game = signal<Game>(new Game([], [], [], "", "", 'WAITING_FOR_ANSWERS', false, false, false));

  playerCount: number = 1;
  catlordName: string = "lord";
  currentCatLordCard = signal<string>("");
  spielerListe = signal<Spieler[]>([new Spieler("dummy-id", "dummy", 1, [], [], false)]);
  playerService = inject(PlayerService);
  private currentCardNr: number = 1

  constructor() {
    this.listenOnEvents();
    this.listenToCardUpdates();
  }

  initMatch(roomId: string) {
    // Check if we are already in this room to avoid infinite loops or re-initialization
    // But allow re-initialization if the current game is empty or has only one player
    if (this.game().gameHash === roomId && this.game().spieler.length > 1) {
      console.log("Match already initialized with players for room:", roomId);
      return;
    }

    const isReload = !!this.socketService.getP2PRoomId();
    console.log(`[MATCH] initMatch for room ${roomId}. Reload: ${isReload}`);

    // Set player name in player service for identification
    const player = this.playerService.getPlayer();
    const playerName = player.name;

    // First, try to get an existing game for this room
    this.socketService.sendGetGame('getGame', roomId);

    // If this client is the host AND no game exists yet, initialize a new game
    if (this.socketService.isHost()) {
      // Check immediately for persisted game to avoid unnecessary delays
      const persistedGame = this.serverService.getGame(roomId);
      if (persistedGame && persistedGame.spieler && persistedGame.spieler.length > 0) {
        console.log(`[MATCH] Found persisted game in ServerService for room ${roomId}`, persistedGame);
        this.game.set(persistedGame);
        this.socketService.joinRoom(roomId);
        return;
      }

      // Small delay to ensure server is ready to receive setGame if not found above
      setTimeout(() => {
        // Re-check after delay
        const recheckPersisted = this.serverService.getGame(roomId);
        if (recheckPersisted && recheckPersisted.spieler && recheckPersisted.spieler.length > 0) {
          console.log(`[MATCH] Found persisted game after delay for room ${roomId}`);
          this.game.set(recheckPersisted);
          this.socketService.joinRoom(roomId);
          return;
        }

        const currentGameState = this.game();
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
          this.game.set(newGame);
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
      const currentGameState = this.game();
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
        this.game.set(placeholderGame);
      }
    }

    console.log("Current game state:", this.game());

    // If we are the host, we are responsible for synchronizing state
    // We can use an effect here since this is a service, but for now we manually call synchronization where needed.
    // However, to keep the BehaviorSubject-like behavior of broadcasting changes, we use a simple subscriber pattern
    // if we still want to keep the "broadcasting" part reactive.
    // Since we want to refactor to signals, we can use an effect() in constructor or just update methods.
    // But the requirements said "whenever signals can be used, use them".
    this.socketService.getGame()
      .subscribe((gameFromServer) => {
        if (!gameFromServer) {
          return;
        }
        // Wenn wir der Host sind und das Spiel vom Server (oder lokalem Speicher) leer ist, ignorieren wir es
        if (this.socketService.isHost() && gameFromServer.spieler.length === 0) {
          return;
        }
        console.log("Updating game from server:", gameFromServer);
        this.game.set(gameFromServer);
      });

    // P2P-Updates abonnieren (um Circular Dependency zu vermeiden)
    this.socketService.p2pGameUpdate$.subscribe(game => {
      if (!game) {
        console.warn("[MATCH] Received null game update, resetting state.");
        this.game.set(new Game(cardSet, [], [], "", "", 'WAITING_FOR_ANSWERS', false, false, false));
        return;
      }
      this.updateGameFromServer(game);
    });
  }

  public updateGameFromServer(game: Game) {
    if (game) {
      console.log("MatchService: updating game from server/P2P", game);
      this.game.set(game);
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
    const currentGame = this.game();
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

      this.game.set({...currentGame});
      // Everyone needs to be able to signal they are ready
      this.socketService.sendUpdateGame('updateGame', currentGame);
    }
  }

  revealAnswers() {
    const currentGame = this.game();
    currentGame.answersRevealed = true;
    this.game.set({...currentGame});
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  selectWinner(winnerName: string) {
    const currentGame = this.game();
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

      this.game.set({...currentGame});
      this.socketService.sendUpdateGame('updateGame', currentGame);
    }
  }

  nextRound() {
    // Only current CatLord should trigger next round
    const playerName = localStorage.getItem('playerName');
    if (!this.isPlayerCatLord(playerName || '')) {
      return;
    }

    const currentGame = this.game();

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
    this.game.set({...currentGame});
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
    const currentGame = this.game();
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
    this.currentCardNr = Date.now() % catloardCardset.length;

    // Make sure we have a valid card
    if (catloardCardset[this.currentCardNr] === undefined) {
      this.currentCardNr = 0; // Default to first card if invalid
    }

    // Update the current card
    const newCard = catloardCardset[this.currentCardNr];
    this.currentCatLordCard.set(newCard);

    // Update the game state with the new card
    currentGame.currentCatlordCard = newCard;
    currentGame.cardset = catloardCardset;

    // Change the catlord
    this.changeCatLord();

    // Broadcast the updated game state to all players
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  changeCatLord() {
    const players = this.game().spieler;
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
    return this.game().spieler.find(player => player.catLord);
  }

  isPlayerCatLord(playername: string): boolean {
    const currentCatLord = this.getCurrentCatLord();
    return currentCatLord?.name === playername;
  }

  createRoom(creatorName: string): string {
    const roomId = this.generateRoomId();
    const initialPlayers = this.initPlayerArr(0, creatorName);
    const newGame = new Game(cardSet, [], initialPlayers, roomId, "", 'WAITING_FOR_ANSWERS', false, false, false);
    this.game.set(newGame);
    return roomId;
  }

  endGame() {
    const currentGame = this.game();
    currentGame.isEnded = true;
    this.game.set({...currentGame});
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  clearGame() {
    console.log("[DEBUG_LOG] MatchService: Clearing game state");
    const emptyGame = new Game([], [], [], "", "", 'WAITING_FOR_ANSWERS', false, false, false);
    this.game.set(emptyGame);
  }

  restartGame() {
    if (!this.socketService.isHost()) return;

    const currentGame = this.game();
    const players = currentGame.spieler;

    // Reset players for new game
    players.forEach(p => {
      p.points = 0;
      p.cards = [];
      p.selectedCards = [];
      p.ready = false;
      p.catLord = false;
    });

    // Pick a random player as first CatLord for the new game
    const firstCatLordIndex = Math.floor(Math.random() * players.length);
    players[firstCatLordIndex].catLord = true;

    // Create new game state with current players but fresh decks
    const restartedGame = new Game(
      [...this.cardEditorService.gaps()],
      [...this.cardEditorService.answers()],
      players,
      currentGame.gameHash,
      "",
      'WAITING_FOR_ANSWERS',
      false, // isStarted
      false, // isEnded
      false  // answersRevealed
    );

    this.game.set(restartedGame);
    this.socketService.sendUpdateGame('updateGame', restartedGame);

    // After reset, we need to start the game (deal cards, pick first gap card)
    // We can call startGame() which handles the rest.
    // Small delay to ensure clients processed the reset if needed,
    // though signal updates are usually fine.
    setTimeout(() => {
      this.startGame();
    }, 100);
  }

  joinRoom(roomId: string, playerName: string): boolean {
    const currentGame = this.game();
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
    this.game.set({...currentGame});
    return true;
  }

  startGame() {
    // Only host should trigger start
    if (!this.socketService.isHost()) {
      console.warn("[DEBUG_LOG] Only host can start game!");
      return;
    }
    const currentGame = this.game();
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
    this.game.set({...currentGame});
    this.socketService.sendUpdateGame('updateGame', currentGame);
  }

  private listenToCardUpdates() {
    this.cardEditorService.cardsUpdated$.subscribe(() => {
      if (this.socketService.isHost()) {
        const currentGame = this.game();
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

          this.game.set(currentGame);
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
    const game = this.game();
    if (game.cardset.length === 0) return "";
    const index = Math.floor(Math.random() * game.cardset.length);
    const initialCard = game.cardset.splice(index, 1)[0];
    this.currentCatLordCard.set(initialCard);
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

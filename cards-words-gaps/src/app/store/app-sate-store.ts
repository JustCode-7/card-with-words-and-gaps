import {Action, Selector, State, StateContext, StateToken} from "@ngxs/store";
import {Injectable} from "@angular/core";
import {Game} from "../modal/game-model";
import {Spieler} from "../modal/spieler-model";

interface AppStateModel {
  game: Game;
}
export class SetPlayers {
  static readonly type = '[Game] SetPlayers';
  constructor(public appStateModel: AppStateModel) {}

}

const APP_STATE_TOKEN = new StateToken<AppStateModel>('appState');

@State({
  name: APP_STATE_TOKEN,
  defaults: {
    game: {
      cardset: [],
      answerset: [],
      spieler: [],
      gameHash: ""
    }
  }
})
@Injectable()
export class GameState {
  @Selector([APP_STATE_TOKEN]) // if you specify the wrong state type, will be a compilation error
  static getGame(state: AppStateModel): Game {
    return state.game;
  }

  @Selector([APP_STATE_TOKEN]) // if you specify the wrong state type, will be a compilation error
  static getGamePlayer(state: AppStateModel): Spieler[] {
    return state.game.spieler;
  }

  @Action(SetPlayers)
  setPlayers(ctx: StateContext<AppStateModel>, action : SetPlayers) {
    const state = ctx.getState();
    state.game.spieler = action.appStateModel.game.spieler
    ctx.patchState(state);

  }
}

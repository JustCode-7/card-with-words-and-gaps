"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomState = void 0;
var RoomState;
(function (RoomState) {
    RoomState[RoomState["Waiting"] = 0] = "Waiting";
    RoomState[RoomState["Playing"] = 1] = "Playing";
    RoomState[RoomState["Finished"] = 2] = "Finished";
})(RoomState || (exports.RoomState = RoomState = {}));

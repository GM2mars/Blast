import Tile from "../Objects/Tile/Tile";

export enum BoosterActionType {
  DESTROY,
  SWAP,
}


export interface IBoosterResult {
  type: BoosterActionType;
}


export interface IDestroyResult extends IBoosterResult {
  type: BoosterActionType.DESTROY;
  tiles: Tile[];
}


export interface ISwapResult extends IBoosterResult {
  type: BoosterActionType.SWAP;
  tiles: [Tile, Tile];
}


export type BoosterResult = IDestroyResult | ISwapResult;
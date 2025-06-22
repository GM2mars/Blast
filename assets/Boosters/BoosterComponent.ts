import GameController from "../Game/GameController";
import { BombBooster } from "./BombBooster";
import { Booster } from "./Booster";
import { SwapBooster } from "./SwapBooster";

const { ccclass, property } = cc._decorator;

export const BoosterType = cc.Enum({
  BOMB: 0,
  SWAP: 1,
});

@ccclass
export class BoosterButton extends cc.Component {

  @property({ type: BoosterType })
  public boosterType = BoosterType.BOMB;

  @property(cc.Integer)
  private initialCount: number = 3;

  @property(cc.Integer)
  private radius: number = 2;

  @property(cc.Label)
  private counterLabel: cc.Label = null;

  @property(GameController)
  private gameController: GameController = null;

  private boosterLogic: Booster = null;
  private _isActive: boolean = false;

  onLoad() {
    switch (this.boosterType) {
      case BoosterType.BOMB:
        this.boosterLogic = new BombBooster(this.initialCount, this.radius);
        break;
      case BoosterType.SWAP:
        this.boosterLogic = new SwapBooster(this.initialCount);
        break;
      default:
        cc.error("Unsupported booster type:", this.boosterType);
        return;
    }

    this.node.on(cc.Node.EventType.TOUCH_END, this.onClick, this);
    this.updateView();
  }

  onClick() {
    if (this._isActive || !this.boosterLogic.canUse()) {
      return;
    }

    this.playClickAnimation();
    this.gameController.activateBooster(this);
  }

  public setActiveState(isActive: boolean) {
    this._isActive = isActive;
    this.node.opacity = isActive ? 150 : 255;
  }

  public onBoosterUsed() {
    this.setActiveState(false);
    this.updateView();
  }

  public getLogic(): Booster {
    return this.boosterLogic;
  }

  updateView() {
    const count = this.boosterLogic.getCount();

    if (this.counterLabel) {
      this.counterLabel.string = count.toString();
    }

    const isExhausted = count <= 0;
    this.node.opacity = isExhausted ? 50 : 255;
  }

  playClickAnimation() {
    const scale = this.node.scale;
    const scaleUp = cc.scaleTo(0.1, scale * 1.1);
    const scaleDown = cc.scaleTo(0.1, scale);
    const sequence = cc.sequence(scaleUp, scaleDown);

    this.node.runAction(sequence);
  }

  onDestroy() {
    this.node.off(cc.Node.EventType.TOUCH_END, this.onClick, this);
  }
}
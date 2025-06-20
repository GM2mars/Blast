const { ccclass, property } = cc._decorator;

@ccclass
export default class Tile extends cc.Component {

  @property([cc.SpriteFrame])
  spriteFrames: cc.SpriteFrame[] = [];

  x: number = 0;
  y: number = 0;
  value: number = 0;
  gameController: any = null;

  onLoad() {
    this.node.on(cc.Node.EventType.TOUCH_END, this.onTileTouch, this);
  }

  init(x: number, y: number, value: number, gameController: any) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.gameController = gameController;

    this.getComponent(cc.Sprite).spriteFrame = this.spriteFrames[value];
  }

  setCoordinates(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  onTileTouch(event: cc.Event.EventTouch) {
    if (this.gameController && !this.gameController.gameOver) {
      this.playClickAnimation();
      this.gameController.onTileClicked(this);
    }
  }

  playClickAnimation() {
    const scaleUp = cc.scaleTo(0.1, 1.1);
    const scaleDown = cc.scaleTo(0.1, 1.0);
    const sequence = cc.sequence(scaleUp, scaleDown);

    this.node.runAction(sequence);
  }

  onDestroy() {
    this.node.off(cc.Node.EventType.TOUCH_END, this.onTileTouch, this);
  }
}
import { Component, PropTypes, Entity, CodeBlockEvents, Vec3, Quaternion, World, Player } from 'horizon/core';

class FallingPlatform extends Component<typeof FallingPlatform> {
  static propsDefinition = {
    platformToDrop: { type: PropTypes.Entity },
  };

  private isFalling: boolean = false;
  private dropDistance: number = 0.5;
  private fallDuration: number = 0.2;
  private disappearDelay: number = 1.0;
  private originalPosition?: Vec3;

  override preStart() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player: Player) => this.onPlayerEnter(player)
    );
  }

  override start() {
    if (this.props.platformToDrop) {
      this.originalPosition = this.props.platformToDrop.position.get();
    }
  }

  private onPlayerEnter(player: Player) {
    if (this.isFalling || !this.props.platformToDrop) {
      return;
    }

    this.isFalling = true;
    const platform = this.props.platformToDrop;
    const startPosition = platform.position.get();
    const endPosition = new Vec3(startPosition.x, startPosition.y - this.dropDistance, startPosition.z);
    
    let elapsedTime = 0;

    const fallUpdate = this.connectLocalBroadcastEvent(World.onUpdate, (data: {deltaTime: number}) => {
      elapsedTime += data.deltaTime;
      const t = Math.min(elapsedTime / this.fallDuration, 1.0);
      
      platform.position.set(Vec3.lerp(startPosition, endPosition, t));

      if (t >= 1.0) {
        fallUpdate.disconnect();
        this.scheduleDisappear(platform);
      }
    });
  }

  private scheduleDisappear(platform: Entity) {
    this.async.setTimeout(() => {
      platform.visible.set(false);
    }, this.disappearDelay * 1000);
  }
}

Component.register(FallingPlatform);
import { Component, PropTypes, Player, Entity, CodeBlockEvents, GrabbableEntity, Handedness, Asset, EntityInteractionMode } from 'horizon/core';

class Charm extends Component<typeof Charm> {
  static propsDefinition = {
    ampSpeed: { type: PropTypes.Number, default: 4.5 }, 
    disabled: { type: PropTypes.Boolean, default: false },
    charmGameObject: { type: PropTypes.Asset },
    platform: { type: PropTypes.Entity },
    selectedPowerUp: { type: PropTypes.String, default: 'speed', },
    gravity: { type: PropTypes.Number, default: 0.5 },
    jumpSpeed: { type: PropTypes.Number, default: 5.0 },
  };

  private playerClones = new Map<number, Entity>();
  private readonly defaultSpeed = 4.5;
  private readonly defaultGravity = 0.5;
  private selectedPowerUp: string = 'speed';

  override preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, this.onGrab.bind(this));
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, this.onRelease.bind(this));
    this.selectedPowerUp = this.props.selectedPowerUp;
  }

  override start() {
    if(this.props.disabled) {
      this.entity.interactionMode.set(EntityInteractionMode.Invalid);
      console.log('Charm is disabled');
      return;
    } 
  }

  private async onGrab(isRightHand: boolean, player: Player) {
    if (this.props.disabled) {
      console.log('Charm is disabled');
      return;
    }

    this.powerUpToGive(player);
    
    const hadCharm = await this.checkIfPlayerHadCharm(isRightHand, player);
    if (hadCharm) { 
      return; 
    }
  
    const charmAset = this.props.charmGameObject;
    if (!charmAset || charmAset === undefined) {
      console.error('Charm game object is not set');
      return; 
    }; 
 
    try {
      const clonedEntity = await this.world.spawnAsset(
        charmAset, 
        player.position.get(), 
        this.entity.rotation.get()
      );
      if (clonedEntity && clonedEntity.length > 0) {
        const clone = clonedEntity[0]; 
        const hand = isRightHand ? Handedness.Right : Handedness.Left; 
        clone.as(GrabbableEntity).forceHold(player, hand, true);
        clone.getComponents(Charm).forEach(charm => {
          charm.selectedPowerUp = this.props.selectedPowerUp;
        });
        this.playerClones.set(player.id, clone); 
        this.centerObjectOnPlatform();
      }
    } catch (err) {
      console.error('Error spawning charm game object:', err);
    }
  }

  private async centerObjectOnPlatform() {
    const platform = this.props.platform;
    if (platform) {
      const platformPosition = platform.position.get();
      platformPosition.y += .9;
      this.entity.position.set(platformPosition);
      console.log('Charm centered on platform');
    }
  }

  private async checkIfPlayerHadCharm(isRightHand: boolean, player: Player) {
    const clone = this.playerClones.get(player.id);
    if (clone) {
      clone.as(GrabbableEntity).forceHold(player, isRightHand ? Handedness.Right : Handedness.Left, true);
      console.log('Player had a charm');
      return true;
    } else { 
      return false; 
    }
  }

  private onRelease(player: Player) {
    console.log("Charm released by player");
    this.resetPlayerPowerUp(player);
    const clone = this.playerClones.get(player.id);
    if (clone) {
      this.world.deleteAsset(clone);
      this.playerClones.delete(player.id);
    }
  }

  private powerUpToGive(player: Player) {
    switch (this.selectedPowerUp) {
      case 'speed':
        const speed = Math.min(this.props.ampSpeed, 45);
        player.locomotionSpeed.set(speed);
        break;
      case 'gravity':
        player.gravity.set(this.props.gravity);
        break;
      default:
        return this.defaultSpeed;
    }
  }

  private resetPlayerPowerUp(player: Player) {
    player.locomotionSpeed.set(this.defaultSpeed);
    player.gravity.set(this.defaultGravity);
  }

}

Component.register(Charm);
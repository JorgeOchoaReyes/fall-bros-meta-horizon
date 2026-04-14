import { Component, PropTypes, CodeBlockEvents, Player, AudioGizmo } from 'horizon/core';

class EnterQueue extends Component<typeof EnterQueue> {
  static propsDefinition = {
    tpSfx: { type: PropTypes.Entity },
    teleportTo: { type: PropTypes.Entity },
  };

  override start() {
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player: Player) => {
        this.onPlayerEnterTrigger(player);
      }
    );
  }

  private async onPlayerEnterTrigger(player: Player) {
    let playerStatus = (this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string }) || {};

    if (typeof playerStatus !== 'object' || playerStatus === null) {
      console.warn(`Player status data is missing or invalid. Initializing new player status object.`);
      playerStatus = {};
    }

    const sound = this.props.tpSfx?.as(AudioGizmo);
      if (sound) {
        sound.play({
          fade: 0,
          players: [player],
        });
    }  

    const playerIdStr = player.id.toString();
    const currentPlayerStatus = playerStatus[playerIdStr];

    if (currentPlayerStatus === 'queued' || currentPlayerStatus === 'playing') {
      console.log(`Player ${player.name.get()} already has status: ${currentPlayerStatus}. No action taken.`);
      return;
    }

    playerStatus[playerIdStr] = 'queued';
    await this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', playerStatus);
    console.log(`Set player ${player.name.get()} status to 'queued'.`);
    this.world.ui.showPopupForPlayer(player, "You have entered the queue!", 3);
  }
}

Component.register(EnterQueue);
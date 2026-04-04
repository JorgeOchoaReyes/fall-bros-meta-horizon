import { Component, PropTypes, CodeBlockEvents, Player, Entity, SpawnPointGizmo, AudioGizmo } from 'horizon/core';

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

    const playerIdStr = player.id.toString();
    const currentPlayerStatus = playerStatus[playerIdStr];

    if (currentPlayerStatus === 'queued' || currentPlayerStatus === 'playing') {
      console.log(`Player ${player.name.get()} already has status: ${currentPlayerStatus}. No action taken.`);
      return;
    }

    playerStatus[playerIdStr] = 'queued';
    await this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', playerStatus);
    console.log(`Set player ${player.name.get()} status to 'queued'.`);
  }
}

Component.register(EnterQueue);
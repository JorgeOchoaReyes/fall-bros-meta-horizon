import * as hz from 'horizon/core';

class RespawnPlayer extends hz.Component<typeof RespawnPlayer> {
  static propsDefinition = {
    spawnPoint: { type: hz.PropTypes.Entity },
    tpSfx: { type: hz.PropTypes.Entity },
  };

  start() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
      this.onPlayerEnterTrigger(player);
    });
  }

    private onPlayerEnterTrigger(player: hz.Player) {
        if (this.props.spawnPoint) {
          const sound = this.props.tpSfx?.as(hz.AudioGizmo);
          if (sound) {
            sound.play({
              fade: 0,
              players: [player],
            });
          } 
          this.props.spawnPoint?.as(hz.SpawnPointGizmo).teleportPlayer(player);
        }
    }

}
hz.Component.register(RespawnPlayer);
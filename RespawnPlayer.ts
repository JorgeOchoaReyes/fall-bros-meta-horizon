import * as hz from 'horizon/core';
import { CourseStatus } from 'CourseStatus';

class RespawnPlayer extends hz.Component<typeof RespawnPlayer> {
  static propsDefinition = {
    spawnPoint: { type: hz.PropTypes.Entity },
    tpSfx: { type: hz.PropTypes.Entity },
    platform1: { type: hz.PropTypes.Entity },
    winnerSfx: { type: hz.PropTypes.Entity },
  };

  start() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
      this.onPlayerEnterTrigger(player);
    });
  }

    private async onPlayerEnterTrigger(player: hz.Player) {
        if (this.props.spawnPoint) {
          const sound = this.props.tpSfx?.as(hz.AudioGizmo);
          if (sound) {
            sound.play({
              fade: 0,
              players: [player],
            });
          } 

          this.props.spawnPoint?.as(hz.SpawnPointGizmo).teleportPlayer(player);

          const courseStatusComponent = this.props.platform1?.getComponents(CourseStatus);
          if (courseStatusComponent) {
            const currentStatus = courseStatusComponent[0].courseStatusObj;
            const removeDeadPlayer = currentStatus.players.filter(p => p.id !== player.id);
            const statusOfCourse = removeDeadPlayer.length > 0 ? true : false;
            if(removeDeadPlayer.length === 0) {
              const allPlayersScores = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_ranks') as { [key: string]: number } || {};

              const currentPlayerScore = allPlayersScores[player.id] || 0;
              allPlayersScores[player.id] = currentPlayerScore + 1;

              this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_ranks', allPlayersScores);

              // winner 
              this.world.leaderboards.setScoreForPlayer(
                "most_wins", 
                player,
                allPlayersScores[player.id],
                true
              );

              this.async.setTimeout(() => {

                const winnerSound = this.props.winnerSfx?.as(hz.AudioGizmo);
                if (winnerSound) {
                  winnerSound.play({
                    fade: 0,
                    players: [player],
                  });
                }

                this.world.ui.showPopupForPlayer(player, "You are the winner!", 3);

              }, 1000);

            } else {
              this.async.setTimeout(() => {
                this.world.ui.showPopupForPlayer(player, "You lost!", 3);
              }, 1000);
            }

            const getExistingStatus = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string } || {};
            const updatedStatus = { ...getExistingStatus, [player.id]: 'dequeued' };
            await this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', updatedStatus);

            courseStatusComponent[0].updateCourseStatus(statusOfCourse, removeDeadPlayer, Date.now());
          } 

        }
    }

}
hz.Component.register(RespawnPlayer);
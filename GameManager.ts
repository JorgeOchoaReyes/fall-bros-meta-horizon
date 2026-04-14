import { CourseStatus } from 'CourseStatus';
import * as hz from 'horizon/core'; 
import { AudioGizmo } from 'horizon/core';

export type PlayerStatusType = 'queued' | 'playing' | 'dequeued';

class GameManager extends hz.Component<typeof GameManager> {
  static propsDefinition = {
    platform1: { type: hz.PropTypes.Entity }, 
    tpSfx: { type: hz.PropTypes.Entity },
  };

  platform_1: hz.Entity | undefined = undefined;

  start() {

    this.platform_1 = this.props.platform1; 

    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
       this.onPlayerEnter(player);
    });
    
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, (player: hz.Player) => {
       this.onPlayerExit(player);
    });``
 
    // set an interval to check for ready players every 10 seconds
     this.async.setInterval(() => {
      const readyPlayers = this.findReadyPlayers();
      const availablePlatform = this.findAvailablePlatform();
      console.log(`Ready players: ${readyPlayers.length}`);
      console.log(`Free platform: ${availablePlatform ? availablePlatform.length : 0}`);

      // algorithm to randomly choose players who are ready and priotize those who have been waiting the longest based on the last time played timestamp 
      const findMostRecentNotPlayedPlayers = (arr: hz.Player[]) => {
        const currentTime = Date.now();
        return arr.sort((a, b) => {
          const aLastPlayed = this.world.persistentStorageWorld.getWorldVariable(`${a.id}_lastGamePlayedTimeStamp`) as number || 0;
          const bLastPlayed = this.world.persistentStorageWorld.getWorldVariable(`${b.id}_lastGamePlayedTimeStamp`) as number || 0;
          const aWaitTime = currentTime - aLastPlayed;
          const bWaitTime = currentTime - bLastPlayed;
          return bWaitTime - aWaitTime; 
        });
      };

      const splitIntoGroupsOfFour = (arr: hz.Player[]) => {
        const groups: hz.Player[][] = [];
        for (let i = 0; i < arr.length; i += 4) {
          groups.push(arr.slice(i, i + 4));
        }
        return groups;
      };

      const sortedPlayers = findMostRecentNotPlayedPlayers(readyPlayers);

      const playerGroups = splitIntoGroupsOfFour(sortedPlayers); 

      playerGroups.forEach((group, index) => {
        if (availablePlatform && availablePlatform[index]) {
          const platform = availablePlatform[index]; 
         
          if(platform) {
            this.teleportPlayersToPlatform(group, platform); 
          }

          // Update player status to 'playing' and update their lastGamePlayedTimeStamp to know to deprioritize them in the queue if they leave and want to rejoin
          group.forEach(player => {
            const getExistingStatus = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string } || {};
            const updatedStatus = { ...getExistingStatus, [player.id]: 'playing', [`${player.id}_lastGamePlayedTimeStamp`]: Date.now() };
            this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', updatedStatus);
          });

        } else {
          console.log(`No available platform for group of ${group.length} players.`);
        }
      });

    }, 10000); // Check every 10 seconds

  }

  teleportPlayersToPlatform(players: hz.Player[], platform: hz.Entity) {
    const courseStatusComp = platform.getComponents(CourseStatus)?.[0];
    if (!courseStatusComp) {
      console.error("CourseStatus component not found on platform.");
      return;
    }

    const timestamp = Date.now(); 
    courseStatusComp.updateCourseStatus(true, players, timestamp);

    players.forEach((player, playerIndex) => {
      const spawnPointProp = `spawnPoint${playerIndex + 1}` as keyof typeof courseStatusComp.props;
      const spawnPointEntity = courseStatusComp.props[spawnPointProp] as unknown as hz.Entity;
      if (spawnPointEntity) {
        try {
          const spawnPoint = spawnPointEntity.as(hz.SpawnPointGizmo);
          this.world.ui.showPopupForPlayer(player, `About to be teleported!`, 3);
          this.async.setTimeout(() => {
            const sound = this.props.tpSfx?.as(AudioGizmo);
            if (sound) {
              sound.play({
                fade: 0,
                players: [player],
              });
            }  
            spawnPoint.teleportPlayer(player);
          }, 3000); 

        } catch (error) {
          console.error(`Error teleporting player ${player.name.get()} to spawn point:`, error);
        }
      } else {
        console.log(`Spawn point ${spawnPointProp} not found for platform.`);
      }
    });
  }

  findReadyPlayers(): hz.Player[] {
    const allPlayers = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string } || {};
    const readyPlayers: hz.Player[] = [];
    for (const playerId in allPlayers) {
      if (allPlayers[playerId] === 'queued') {
        const player = this.world.getPlayers().find(p => p.id === parseInt(playerId));
        if (player) {
          readyPlayers.push(player);
        }
      }
    }

    return readyPlayers;
  }

  findAvailablePlatform(): hz.Entity[] | null {
    const platforms = [
      this.platform_1
    ] 

     const availablePlatforms = [] as hz.Entity[]; 
     platforms.forEach((platform, index) => {
      if (platform) {
        const getComps = platform.getComponents(CourseStatus); 

        if(getComps.length === 0) {
          console.warn(`Platform ${index + 1} does not have a CourseStatus component.`);
          return;
        }

        const targetComp = getComps[0];
        const isActive = targetComp.courseStatusObj.active;  
        if (!isActive) {
          console.log(`Platform ${index + 1} is available.`);
          availablePlatforms.push(platform);
        } else {
          console.log(`Platform ${index + 1} is occupied.`);
        }
      }
    });
    return availablePlatforms;
  }

  private async onPlayerEnter(player: hz.Player) {
    const getExistingStatus = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string } || {};
    const updatedStatus = { ...getExistingStatus, [player.id]: 'dequeued' };
    await this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', updatedStatus);
  }


  private async onPlayerExit(player: hz.Player) {
    const getExistingStatus = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string } || {};
    const updatedStatus = { ...getExistingStatus, [player.id]: 'dequeued' };
    await this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', updatedStatus);
  } 

}
hz.Component.register(GameManager);
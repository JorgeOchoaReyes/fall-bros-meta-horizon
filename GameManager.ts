import { CourseStatus } from 'CourseStatus';
import * as hz from 'horizon/core'; 

export type PlayerStatusType = 'queued' | 'playing' | 'dequeued';

const courseStatusArrayOfNetworkEvents: hz.NetworkEvent<{ active: boolean; players: hz.Player[]; timestamp: number | null }>[] = [
  new hz.NetworkEvent<{ active: boolean; players: hz.Player[]; timestamp: number | null }>("CourseStatusChange1"),
  new hz.NetworkEvent<{ active: boolean; players: hz.Player[]; timestamp: number | null }>("CourseStatusChange2"),
  new hz.NetworkEvent<{ active: boolean; players: hz.Player[]; timestamp: number | null }>("CourseStatusChange3"),
  new hz.NetworkEvent<{ active: boolean; players: hz.Player[]; timestamp: number | null }>("CourseStatusChange4"),
];

class GameManager extends hz.Component<typeof GameManager> {
  static propsDefinition = {
    platform1: { type: hz.PropTypes.Entity }, 
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
     
    this.connectNetworkEvent(this.entity, courseStatusArrayOfNetworkEvents[0], (data: { active: boolean; players: hz.Player[]; timestamps: number }) => {
       console.log(`Received course status change event from platform ${0 + 1}:`, data);
    });
 
    // set an interval to check for ready players every 5 seconds
     this.async.setInterval(() => {
      const readyPlayers = this.findReadyPlayers();
      const availablePlatform = this.findAvailablePlatform();
      console.log(`Checking for ready players. Total ready players: ${readyPlayers.length}`);
      console.log(`Available platform: ${availablePlatform ? availablePlatform.length : 0}`);

      const splitIntoGroupsOfFour = (arr: hz.Player[]) => {
        const groups: hz.Player[][] = [];
        for (let i = 0; i < arr.length; i += 4) {
          groups.push(arr.slice(i, i + 4));
        }
        return groups;
      };

      const playerGroups = splitIntoGroupsOfFour(readyPlayers); 

      playerGroups.forEach((group, index) => {
        if (availablePlatform && availablePlatform[index]) {
          const platform = availablePlatform[index]; 
         
          if(platform) {
            const courseStatusComp = platform.getComponents(CourseStatus)?.[0];
            const timestamp = Date.now(); 
            courseStatusComp.updateCourseStatus(true, group, timestamp);

            console.log("Group Size:", group.length);

            // Teleport players to the platform's spawn point
            group.forEach((player, playerIndex) => {
              const spawnPointProp = `spawnPoint${playerIndex + 1}` as keyof typeof courseStatusComp.props;
              const spawnPointEntity = courseStatusComp.props[spawnPointProp] as unknown as hz.Entity;
              if (spawnPointEntity) {
                const spawnPoint = spawnPointEntity.as(hz.SpawnPointGizmo);
                spawnPoint.teleportPlayer(player);
                console.log(`Teleporting player ${player.name.get()} to spawn point ${spawnPointEntity.position.get()} on platform ${index + 1}`);
              } else {
                console.log(`Spawn point ${spawnPointProp} not found for platform ${index + 1}`);
              }
            });

          }

          // Update player status to 'playing'
          group.forEach(player => {
            const getExistingStatus = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string } || {};
            const updatedStatus = { ...getExistingStatus, [player.id]: 'playing' };
            this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', updatedStatus);
          });

        } else {
          console.log(`No available platform for group of ${group.length} players.`);
        }
      });
      

    }, 5000);

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
        const isActive = targetComp.props.active;
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

    // if the player was playing we should find which platform they were on and remove them to ensure platform is free at some point 
  } 

}
hz.Component.register(GameManager);
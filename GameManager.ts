import * as hz from 'horizon/core'; 

export type CourseStatusType = {
  active: boolean;
  players: hz.Player[];
  courseName: string;
}

export type PlayerStatusType = 'queued' | 'playing' | 'dequeued';

class GameManager extends hz.Component<typeof GameManager> {
  static propsDefinition = {
    platform1: { type: hz.PropTypes.Entity }, 
  };

  start() {
     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
        console.log(`Player ${player.name.get()} entered the trigger.`);
        this.onPlayerEnter(player);
     });

     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, (player: hz.Player) => {
        console.log(`Player ${player.name.get()} exited the trigger.`);
        this.onPlayerExit(player);
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
      console.log(`Player groups:`, playerGroups);
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

  findAvailablePlatform(): CourseStatusType[] | null {
    const platforms = ["course_1", "course_2", "course_3", "course_4"]
      .map(courseName => this.world.persistentStorageWorld.getWorldVariable(`GameManager:${courseName}`))
      .filter(entity => entity !== null) as unknown as CourseStatusType[];

    const availablePlatforms = [] as CourseStatusType[];
     platforms.forEach((platform, index) => {
      if (platform) { 
        const isActive = platform?.active;
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
    const resuls = await this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', updatedStatus);
 
  }


  private async onPlayerExit(player: hz.Player) {
    const getExistingStatus = this.world.persistentStorageWorld.getWorldVariable('GameManager:player_status') as { [key: string]: string } || {};
    const updatedStatus = { ...getExistingStatus, [player.id]: 'dequeued' };
    const resuls = await this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('GameManager:player_status', updatedStatus);
  }
}
hz.Component.register(GameManager);
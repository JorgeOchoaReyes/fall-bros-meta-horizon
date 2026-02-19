import * as hz from 'horizon/core';
import { CourseStatus } from './CourseStatus';

class GameManager extends hz.Component<typeof GameManager> {
  static propsDefinition = {
    platform1: { type: hz.PropTypes.Entity },
    platform2: { type: hz.PropTypes.Entity },
    platform3: { type: hz.PropTypes.Entity },
    platform4: { type: hz.PropTypes.Entity },
  };

  start() {
     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {

     });

     this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitTrigger, (player: hz.Player) => {
       this.onPlayerExit(player);
     });

    // set an interval to check for ready players every 5 seconds
    
     this.async.setInterval(() => {
      const readyPlayers = this.findReadyPlayers();
      const availablePlatform = this.findAvailablePlatform();
      console.log(`Checking for ready players. Total ready players: ${readyPlayers.length}`);
      console.log(`Available platform: ${availablePlatform ? availablePlatform.length : 0}`);
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
    const platforms = [this.props.platform1, this.props.platform2, this.props.platform3, this.props.platform4];
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

  onPlayerEnter(player: hz.Player) {
    this.world.persistentStorage.setPlayerVariable(player, 'GameManager:player_status', 'queued');
    const readyPlayers = this.findReadyPlayers();
    console.log(`Player ${player.name} entered. Total ready players: ${readyPlayers.length}`);
  }


  onPlayerExit(player: hz.Player) {
    this.world.persistentStorage.setPlayerVariable(player, 'GameManager:player_status', 'dequeued');
  }
}
hz.Component.register(GameManager);
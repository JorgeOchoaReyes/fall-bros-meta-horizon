import * as hz from 'horizon/core';

class CourseStatus extends hz.Component<typeof CourseStatus> {
  static propsDefinition = {
    active: { type: hz.PropTypes.Boolean, default: false }, 
    players: { type: hz.PropTypes.PlayerArray, default: [] },
    courseNumber: { type: hz.PropTypes.Number, default: 0 },
    spawnPoint1: { type: hz.PropTypes.Entity, default: null },
    spawnPoint2: { type: hz.PropTypes.Entity, default: null },
    spawnPoint3: { type: hz.PropTypes.Entity, default: null },
    spawnPoint4: { type: hz.PropTypes.Entity, default: null },
  };

  courseStatusObj = {
    active: false, 
    players: [] as hz.Player[],
    timestamp: null as number | null,
  }

  varChangeEvent = new hz.NetworkEvent<{ active: boolean; players: hz.Player[]; timestamp: number | null }>(`CourseStatusChange1`);

  preStart() { 
    
  } 

  start() { 
    this.courseStatusObj.active = this.props.active;
    this.courseStatusObj.players = [...this.props.players];

    this.async.setInterval(() => { 
      console.log(`Course ${this.props.courseNumber} status:`, 
        `Active: ${this.courseStatusObj.active}`, 
        `Players: ${this.courseStatusObj.players.length}`, 
        `Timestamp: ${this.courseStatusObj.timestamp}`,
        'Time Elapsed since game start:', Date.now() - (this.courseStatusObj.timestamp || Date.now())
      ); 
    } , 1000);

  }

  updateCourseStatus(active: boolean, players: hz.Player[], timestamp: number | null = null) {
    this.courseStatusObj.active = active;
    this.courseStatusObj.players = players;
    this.courseStatusObj.timestamp = timestamp;
    console.log(`Course ${this.props.courseNumber} status updated:`,
      `Active: ${active}`,
      `Players: ${players.length}`,
    );
    this.sendNetworkBroadcastEvent(this.varChangeEvent, { active, players, timestamp: null });
  }
}

export {
  CourseStatus
}

hz.Component.register(CourseStatus);
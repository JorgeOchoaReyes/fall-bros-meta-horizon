import * as hz from 'horizon/core';

class CourseStatus extends hz.Component<typeof CourseStatus> {
  static propsDefinition = {
    active: { type: hz.PropTypes.Boolean, default: false }, 
    players: { type: hz.PropTypes.PlayerArray, default: [] },
    courseNumber: { type: hz.PropTypes.Number, default: 0 },
  };

  courseStatusObj = {
    active: false, 
    players: [] as hz.Player[],
    timestamp: null as number | null,
  }

  varChangeEvent = new hz.NetworkEvent<{ active: boolean; players: hz.Player[]; timestamp: number | null }>("CourseStatusChange");

  preStart() { 
  } 

  start() { 
    this.courseStatusObj.active = this.props.active;
    this.courseStatusObj.players = [...this.props.players];

    this.async.setInterval(() => {
      // log details of the course status every 10 seconds
      console.log(`Course ${this.props.courseNumber} status:`, 
        `Active: ${this.courseStatusObj.active}`, 
        `Players: ${this.courseStatusObj.players.length}`, 
        `Timestamp: ${this.courseStatusObj.timestamp}`
      );

    } , 1000);

  }

  updateCourseStatus(active: boolean, players: hz.Player[]) {
    this.courseStatusObj.active = active;
    this.courseStatusObj.players = players;
    this.sendNetworkBroadcastEvent(this.varChangeEvent, { active, players, timestamp: null });
  }

}

export {
  CourseStatus
}

hz.Component.register(CourseStatus);
import * as hz from 'horizon/core';

class CourseStatus extends hz.Component<typeof CourseStatus> {
  static propsDefinition = {
    active: { type: hz.PropTypes.Boolean, default: false }, 
    players: { type: hz.PropTypes.PlayerArray, default: [] },
    courseNumber: { type: hz.PropTypes.Number, default: 0 },
  };

  courseActive = false;
  coursePlayers: hz.Player[] = []; 

  preStart() { 
  }

  start() { 
  }
}

export {
  CourseStatus
}

hz.Component.register(CourseStatus);
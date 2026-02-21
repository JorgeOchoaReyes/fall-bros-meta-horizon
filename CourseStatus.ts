import * as hz from 'horizon/core';

class CourseStatus extends hz.Component<typeof CourseStatus> {
  static propsDefinition = {
    active: { type: hz.PropTypes.Boolean, default: false }, 
    players: { type: hz.PropTypes.PlayerArray, default: [] }
  };

  start() {
    
  }
}

export {
  CourseStatus
}

hz.Component.register(CourseStatus);
import * as hz from 'horizon/core';

class CourseStatus extends hz.Component<typeof CourseStatus> {
  static propsDefinition = {
    active: { type: hz.PropTypes.Boolean, default: false }, 
  };

  start() {
    
  }
}

export {
  CourseStatus,
}

hz.Component.register(CourseStatus);
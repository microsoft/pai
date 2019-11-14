import uuid4 from 'uuid/v4';

export class jobConfig {
  constructor(
    protocolVersion = null,
    name = null,
    type = null,
    jobRetryCount = 0,
    prerequisites = {},
    taskRoles = [],
    defaults = {},
  ) {
    this.id = uuid4();
    this.protocolVersion = protocolVersion;
    this.name = name;
    this.type = type;
    this.jobRetryCount = jobRetryCount;
    this.prerequisites = prerequisites;
    this.taskRoles = taskRoles;
    this.defaults = defaults;
  }
}

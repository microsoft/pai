import uuid4 from 'uuid/v4';

export class TaskRole {
  constructor(
    name = null,
    instances = 0,
    completion = {},
    taskRetryCount = 0,
    dockerImage = null,
    resourcePerInstance = {},
    commands = [],
  ) {
    this.id = uuid4();
    this.name = name;
    this.instances = instances;
    this.completion = completion;
    this.taskRetryCount = taskRetryCount;
    this.docker_image = dockerImage;
    this.resourcePerInstance = resourcePerInstance;
    this.commands = commands;
  }
}

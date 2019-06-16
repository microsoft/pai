export class InputData {
  constructor(dataType, containerPath, dataSource, uploadFiles=null) {
    this.data_type = dataType;
    this.container_path = containerPath;
    this.data_source = dataSource;
    this.uploadFiles = uploadFiles;
  }
}

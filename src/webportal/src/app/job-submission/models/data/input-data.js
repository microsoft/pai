export class InputData {
  constructor(mountPath, dataSource, sourceType, uploadFiles = null) {
    this.mountPath = mountPath;
    this.sourceType = sourceType;
    this.dataSource = dataSource;
    this.uploadFiles = uploadFiles;
  }
}

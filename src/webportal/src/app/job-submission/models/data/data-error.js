export class DataError {
  constructor(teamDataListLength, customDataListLength) {
    this.customStorageContainerPathError = Array(customDataListLength);
    this.customStorageDataSourceError = Array(customDataListLength);
  }
}

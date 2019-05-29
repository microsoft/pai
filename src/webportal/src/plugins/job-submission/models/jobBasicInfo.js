class JobBasicInfo {
  convertToProtocolFormat() {
    const jobRetryCount = this.jobRetryCount === undefined || typeof(jobRetryCount) !== 'number'? 0: this.jobRetryCount;
    return {
              protocolVersion: 2,
              name: this.name,
              type: 'job',
              jobRetryCount: jobRetryCount,
              default: {
                virtualCluster: this.virtualCluster
              }
            }
  }
}
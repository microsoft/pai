export function validateMountPath(path) {
  let illegalMessage = '';
  const pathRegex = /^(\/[A-Za-z0-9\-._]+)+$/;
  if (path.charAt(path.length - 1) === '/') {
    illegalMessage = 'path should not end with "/"';

    return {isLegal: false, illegalMessage};
  }
  if (!pathRegex.test(path)) {
    illegalMessage = 'path is not illegal';

    return {isLegal: false, illegalMessage};
  }

  return {isLegal: true};
}

export function validateHttpUrl(url) {
  if (!url) {
    return {isLegal: false, illegalMessage: 'http url should not be empty'};
  }

  return {isLegal: true};
}

export function validateGitUrl(url) {
  const gitRegex = /(git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|#[-\d\w._]+?)/;
  let illegalMessage = '';
  if (!gitRegex.test(url)) {
    illegalMessage = 'git url is not illegal';

    return {isLegal: false, illegalMessage};
  }

  return {isLegal: true, illegalMessage};
}

export function validateHDFSPathSync(path) {
  const valid = validateMountPath(path);
  if (!valid.isLegal) {
    return valid;
  }
  return {isLegal: true};
}

export async function validateHDFSPathAsync(path, hdfsClient) {
  const valid = validateMountPath(path);
  if (!valid.isLegal) {
    return valid;
  }

  // pass valid if hdfsClient is not provided
  if (!hdfsClient) {
    return {
      isLegal: true,
    };
  } else {
    const isAccess = await hdfsClient.checkAccess();
    if (!isAccess) {
      return {
        isLegal: false,
        illegalMessage: 'hdfs server could not be accessed',
      };
    }
  }

  try {
    await hdfsClient.readDir(path);
    return {isLegal: true};
  } catch (e) {
    return {isLegal: false, illegalMessage: e.message};
  }
}

export function validateNFSUrl(url) {
  const nFSRegixPrefix = /^nfs:\/\/*/;
  const nFSRegex = /^nfs:\/\/[A-Za-z0-9\-._]+(\/[A-Za-z0-9\-._]+)+$/;
  const nFSRegexEndWithSlash = /^nfs:\/\/[A-Za-z0-9\-._]+\/$/;
  let illegalMessage = '';
  if (!nFSRegixPrefix.test(url)) {
    illegalMessage = 'path should begin with nfs:\/\/';
    return {isLegal: false, illegalMessage};
  }
  if (!nFSRegexEndWithSlash.test(url) && url.charAt(url.length - 1) === '/') {
    illegalMessage = 'path should not end with "/"';
    return {isLegal: false, illegalMessage};
  }
  if (!nFSRegex.test(url) && !nFSRegexEndWithSlash.test(url)) {
    illegalMessage = 'NFS url is not illegal';
    return {isLegal: false, illegalMessage};
  }
  return {isLegal: true};
}

export function validateHDFSUrl(url) {
  const hDFSRegixPrefix = /^hdfs:\/\/*/;
  const hDFSRegex = /^hdfs:\/\/[A-Za-z0-9\-._]+:[0-9]+(\/[A-Za-z0-9\-._]+)+$/;
  const hDFSRegexEndWithSlash = /^hdfs:\/\/[A-Za-z0-9\-._]+:[0-9]+\/$/;
  let illegalMessage = '';
  if (!hDFSRegixPrefix.test(url)) {
    illegalMessage = 'path should begin with hdfs:\/\/';
    return {isLegal: false, illegalMessage};
  }
  if (!hDFSRegexEndWithSlash.test(url) && url.charAt(url.length - 1) === '/') {
    illegalMessage = 'path should not end with "/"';
    return {isLegal: false, illegalMessage};
  }
  if (!hDFSRegex.test(url) && !hDFSRegexEndWithSlash.test(url)) {
    illegalMessage = 'HDFS url is not illegal';
    return {isLegal: false, illegalMessage};
  }
  return {isLegal: true};
}

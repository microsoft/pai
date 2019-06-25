export function validateMountPath(path) {
  let illegalMessage = '';
  const pathRegex = /^(\/[A-Za-z0-9\-._]+)+$/;
  if (path.charAt(0) !== '/') {
    illegalMessage = 'path should start with "/"';

    return {isLegal: false, illegalMessage};
  }
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

export async function validateHDFSPath(hdfsClient, path) {
  const valid = validateMountPath(path);
  if (!valid.isLegal) {
    return valid;
  }

  if (!hdfsClient) {
    return {
      isLegal: false,
      illegalMessage: 'hdfs server could not be accessed',
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

export function validateCommand(command) {
  return validateMountPath(command);
}

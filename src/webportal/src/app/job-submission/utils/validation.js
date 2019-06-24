
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

export function validateGitUrl(url) {
  const gitRegex = /(git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|#[-\d\w._]+?)/;
  let illegalMessage = '';
  if (!gitRegex.test(url)) {
    illegalMessage = 'git url is not illegal';

    return {isLegal: false, illegalMessage};
  }

  return {isLegal: true, illegalMessage};
}

export function validateHDFSPath(path) {
  return validateMountPath(path);
}

export function validateCommand(command) {
  return validateMountPath(command);
}

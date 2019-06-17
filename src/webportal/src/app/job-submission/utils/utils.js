import {isObject, isEmpty, isNil, isArrayLike} from 'lodash';
import {basename} from 'path';

export const keyValueArrayReducer = (acc, cur) => {
  acc = {...acc, ...cur};
  return acc;
};

export function removeEmptyProperties(obj) {
  if (!isObject(obj)) {
    return;
  }

  const newObj = {...obj};
  Object.keys(newObj).forEach((key) => {
    const checkedEle = newObj[key];
    if (!isEmpty(checkedEle)) {
      return;
    }

    // ignore non-array-like primitive type
    if (
      !isObject(checkedEle) &&
      !isArrayLike(checkedEle) &&
      !isNil(checkedEle)
    ) {
      return;
    }

    delete newObj[key];
  });
  return newObj;
}

export function getFileNameFromHttp(url) {
  return basename(url, '.git');
}

export function getProjectNameFromGit(url) {
  return basename(url, '.git');
}

export function getFolderNameFromHDFS(path) {
  return basename(path);
}

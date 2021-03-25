// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { isObject, isEmpty, isNil, isArrayLike } from 'lodash';

export function removeEmptyProperties(obj) {
  if (!isObject(obj)) {
    return;
  }

  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    const onCheckingElement = newObj[key];
    if (!isEmpty(onCheckingElement)) {
      return;
    }

    // ignore non-array-like primitive type
    if (
      !isObject(onCheckingElement) &&
      !isArrayLike(onCheckingElement) &&
      !isNil(onCheckingElement)
    ) {
      return;
    }

    delete newObj[key];
  });
  return newObj;
}

export function createUniqueName(usedNames, namePrefix, startIndex) {
  let index = startIndex;
  let name = `${namePrefix}_${index++}`;
  while (usedNames.find(usedName => usedName === name)) {
    name = `${namePrefix}_${index++}`;
  }
  return [name, index];
}

export function generateDefaultDescription(name) {
  return (
    (name ? `# ${name}\n\n` : '\n') +
    `## Training data\n\n` +
    '## How to use\n\n' +
    `## Reference\n\n`
  );
}

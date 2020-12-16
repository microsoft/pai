import FuzzySet from 'fuzzyset.js';

export function getErrorGroupsByFuzzySet(allErrorInfos, getPerTaskDiagnositcFunc, maxMessageLenght = 200, fuzzyThreshold = 0.8) {
  let fuzzyErrors = FuzzySet();
  let errorGroups = {}; // {errorMessage: [tasks]}
  let fullErrorMsgMapping = {}; // {errorDigest: errorMessage}
  for (let task of allErrorInfos) {
    let rawDigest = getPerTaskDiagnositcFunc(task);
    let digest = rawDigest.length <= maxMessageLenght ? rawDigest : rawDigest.substring(0, maxMessageLenght);
    let matched = fuzzyErrors.get(digest, null, fuzzyThreshold);
    let matchedDigest;
    if (matched) {
      matchedDigest = matched[0][1];
    } else {
      fullErrorMsgMapping[digest] = rawDigest;
      errorGroups[rawDigest] = [];
      fuzzyErrors.add(digest);
      matchedDigest = digest; // No one matched. Use itself.
    }
    errorGroups[fullErrorMsgMapping[matchedDigest]].push(task);
  }
  return errorGroups;
}

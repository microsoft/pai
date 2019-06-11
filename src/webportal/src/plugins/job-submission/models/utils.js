export const keyValueArrayReducer = (acc, cur) => {
  acc = {...acc, ...cur};
  return acc;
};

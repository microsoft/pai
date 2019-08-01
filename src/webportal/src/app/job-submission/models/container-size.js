import { isNil } from 'lodash';

const skuUnit = {
  gpu: 1,
  cpu: 4,
  memoryMB: 8192,
};

export function getDefaultContainerSize(gpu) {
  if (isNil(gpu)) {
    gpu = 1;
  }
  const factor = Math.max(gpu, 1);
  return {
    gpu,
    cpu: factor * skuUnit.cpu,
    memoryMB: factor * skuUnit.memoryMB,
  };
}

export function isDefaultContainerSize(size) {
  const factor = Math.max(size.gpu, 1);
  return (
    size.cpu === skuUnit.cpu * factor &&
    size.memoryMB === size.memoryMB * factor
  );
}

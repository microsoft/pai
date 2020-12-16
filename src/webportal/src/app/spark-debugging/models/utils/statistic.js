/**
 * Get avg value from a number array
 * @param {Array[Number]} nums 
 */
export function avg(nums) {
    if (nums.length === 0) {
        throw new Error('Empty array');
    }
    return nums.reduce((a, b) => a + b)/nums.length;
}

/**
 * Get p75 value from a sorted number array
 * @param {Array[number]} nums 
 */
export function p75(nums) {
    return nthPercentile(nums, 75);
}

/**
 * Get p95 value from a sorted number array
 * @param {Array[number]} nums 
 */
export function p95(nums) {
    return nthPercentile(nums, 95);
}

/**
 * Get nth percentile value from a sorted number array
 * @param {Array[number]} nums 
 * @param {number} n 
 */
export function nthPercentile(nums, n) {
    if (n < 0 || n > 100) {
        throw new Error('Invalid n');
    }
    if (nums.length === 0) {
        throw new Error('Empty array');
    }
    return nums[Math.ceil((nums.length + 1)*n/100 - 1)];
}

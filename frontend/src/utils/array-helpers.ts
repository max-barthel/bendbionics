/**
 * Adjust an array to a target length by extending or truncating.
 *
 * If the array is shorter than the target length, it will be extended
 * with the default value. If it's longer, it will be truncated.
 *
 * @param currentArray - Current array to adjust
 * @param targetLength - Desired length of the array
 * @param defaultValue - Value to use when extending the array
 * @returns Adjusted array with the target length
 */
export function adjustArray<T>(
  currentArray: T[],
  targetLength: number,
  defaultValue: T
): T[] {
  if (currentArray.length === targetLength) return currentArray;

  if (currentArray.length < targetLength) {
    const newElements = new Array(targetLength - currentArray.length).fill(defaultValue);
    return [...currentArray, ...newElements];
  }

  return currentArray.slice(0, targetLength);
}


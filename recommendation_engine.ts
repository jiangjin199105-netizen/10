export interface DrawRecord {
  period: string;
  result: number[] | string;
  time: string;
}

export function getRecommendedNumbers(draws: DrawRecord[]): number[] | null {
  if (draws.length < 5) return null;

  const getPosition = (championDraw: DrawRecord, targetDraw: DrawRecord) => {
    const champion = Array.isArray(championDraw.result)
      ? championDraw.result[0]
      : parseInt(String(championDraw.result).split(/[,\s]+/)[0]);

    const targetNums = Array.isArray(targetDraw.result)
      ? targetDraw.result
      : String(targetDraw.result).split(/[,\s]+/).map(n => parseInt(n.trim()));

    const leftHalf = targetNums.slice(0, 5);
    const rightHalf = targetNums.slice(5);

    if (leftHalf.includes(champion)) return 'left';
    if (rightHalf.includes(champion)) return 'right';
    return 'none';
  };

  // Logic (Reduced Offset for 5-period support):
  // 2nd (draws[1]) vs 4th (draws[3])
  // 3rd (draws[2]) vs 5th (draws[4])
  // Latest (draws[0]) vs 3rd (draws[2])
  const p2 = getPosition(draws[1], draws[3]);
  const p3 = getPosition(draws[2], draws[4]);
  const p1 = getPosition(draws[0], draws[2]);

  let patternType = '';
  if (p2 === 'left' && p3 === 'left' && p1 === 'right') {
    patternType = 'Left-Right';
  } else if (p2 === 'right' && p3 === 'right' && p1 === 'left') {
    patternType = 'Right-Left';
  }

  if (!patternType) return null;

  // Generate Prediction
  // Source: draws[1]
  // Key: draws[0].champion
  // Position Check: draws[2]
  const champion = Array.isArray(draws[0].result)
    ? draws[0].result[0]
    : parseInt(String(draws[0].result).split(/[,\s]+/)[0]);

  // Check position in 3rd draw
  const targetDraw2 = draws[2];
  const targetNums2 = Array.isArray(targetDraw2.result)
    ? targetDraw2.result
    : String(targetDraw2.result).split(/[,\s]+/).map(n => parseInt(n.trim()));

  const index = targetNums2.indexOf(champion); // 0-based index in 3rd draw

  // Pick numbers from 2nd draw
  const targetDraw1 = draws[1];
  const targetNums1 = Array.isArray(targetDraw1.result)
    ? targetDraw1.result
    : String(targetDraw1.result).split(/[,\s]+/).map(n => parseInt(n.trim()));

  let recommendedNumbers: number[] = [];

  if (index === 0) { // 1st position in 3rd
    // 6, 7, 8, 10名 -> indices 5, 6, 7, 9 from 2nd
    recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[9]];
  } else if (index === 9) { // 10th position in 3rd
    // 1, 3, 4, 5名 -> indices 0, 2, 3, 4 from 2nd
    recommendedNumbers = [targetNums1[0], targetNums1[2], targetNums1[3], targetNums1[4]];
  } else if (index >= 1 && index <= 4) { // Left half (not 1st) in 3rd
    // 6, 7, 8, 9名 -> indices 5, 6, 7, 8 from 2nd
    recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[8]];
  } else if (index >= 5 && index <= 8) { // Right half (not 10th) in 3rd
    // 2, 3, 4, 5名 -> indices 1, 2, 3, 4 from 2nd
    recommendedNumbers = [targetNums1[1], targetNums1[2], targetNums1[3], targetNums1[4]];
  }

  return recommendedNumbers.length > 0 ? recommendedNumbers : null;
}

import { getRecommendedNumbers, DrawRecord } from './recommendation_engine';

// Example usage with 5 periods of data
const mockDraws: DrawRecord[] = [
  { period: '1005', result: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], time: '...' },
  { period: '1004', result: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], time: '...' },
  { period: '1003', result: [2, 4, 6, 8, 10, 1, 3, 5, 7, 9], time: '...' },
  { period: '1002', result: [9, 7, 5, 3, 1, 10, 8, 6, 4, 2], time: '...' },
  { period: '1001', result: [3, 6, 9, 2, 5, 8, 1, 4, 7, 10], time: '...' },
];

const recommendation = getRecommendedNumbers(mockDraws);
console.log('Recommended Numbers:', recommendation);

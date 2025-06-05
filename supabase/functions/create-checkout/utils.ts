export function calculatePlatformFee(price: number, contentType: string): number {
  // Default platform fee is 10%
  const defaultFeePercentage = 0.10;
  
  return Math.round(price * defaultFeePercentage);
}
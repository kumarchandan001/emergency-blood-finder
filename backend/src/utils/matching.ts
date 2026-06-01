/**
 * Blood group compatibility mapping
 * Key: Recipient's blood group
 * Value: Array of compatible donor blood groups
 */
export const COMPATIBILITY_MAP: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

/**
 * Calculates the distance between two coordinate pairs in kilometers using the Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2)); // return distance with 2 decimal places
};

/**
 * Ranks donors based on Availability, Proximity, and Donation History
 * Max Score: 100
 * - Availability: 40 points
 * - Proximity (Distance): Max 40 points
 * - Recent Activity (Eligibility): Max 20 points
 */
export const calculateScore = (
  distanceKm: number,
  available: boolean,
  lastDonationDate?: Date
): number => {
  if (!available) return 0;

  let score = 40; // Base score for availability

  // Proximity Scoring (Max 40 points)
  if (distanceKm <= 2) {
    score += 40;
  } else if (distanceKm <= 5) {
    score += 30;
  } else if (distanceKm <= 10) {
    score += 20;
  } else if (distanceKm <= 20) {
    score += 10;
  } else {
    score += 5;
  }

  // Recency/Cooldown Check (Max 20 points)
  if (lastDonationDate) {
    const diffTime = Math.abs(new Date().getTime() - new Date(lastDonationDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Cooldown is 90 days for safe blood donation
    if (diffDays < 90) {
      return 0; // Ineligible
    } else if (diffDays > 180) {
      score += 20; // Fully recovered and ready (active but not too recent)
    } else {
      score += 10; // Out of cooldown but somewhat recent
    }
  } else {
    score += 20; // No donation history = fully eligible
  }

  return score;
};

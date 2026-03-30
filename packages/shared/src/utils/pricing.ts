/**
 * Pricing Utilities - Resale Price Calculations
 *
 * This module provides pricing rules for the Revendiste platform.
 * The 15% markup cap:
 * - Protects buyers from excessive markups and speculation
 * - Allows publishers to recover their investment (original platform fees ~10-12%)
 * - Is NOT intended for profit generation
 */

import {roundOrderAmount} from './amounts';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum markup percentage allowed above face value.
 * This allows publishers to recover original platform fees (~10-12%)
 * while protecting buyers from excessive markups.
 */
export const MAX_MARKUP_PERCENTAGE = 0.15; // 15%

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Calculates the maximum allowed resale price for a ticket.
 * Returns 115% of the face value, rounded to 2 decimal places.
 *
 * @param faceValue - The original face value of the ticket
 * @returns The maximum allowed resale price
 *
 * @example
 * calculateMaxResalePrice(1000) // 1150
 * calculateMaxResalePrice(500)  // 575
 */
export function calculateMaxResalePrice(faceValue: number): number {
  return roundOrderAmount(faceValue * (1 + MAX_MARKUP_PERCENTAGE));
}

/**
 * Checks if a given price exceeds the maximum allowed resale price.
 *
 * @param price - The proposed resale price
 * @param faceValue - The original face value of the ticket
 * @returns true if price exceeds the maximum allowed, false otherwise
 *
 * @example
 * exceedsMaxResalePrice(1150, 1000) // false (exactly 115%)
 * exceedsMaxResalePrice(1151, 1000) // true (exceeds 115%)
 */
export function exceedsMaxResalePrice(price: number, faceValue: number): boolean {
  return price > calculateMaxResalePrice(faceValue);
}

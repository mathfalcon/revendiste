import {GOOGLE_PLACES_API_KEY} from '~/config/env';
import {logger} from '~/utils';

export interface GooglePlaceResult {
  placeId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface NearbySearchResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface NearbySearchResponse {
  results: NearbySearchResult[];
  status: string;
  error_message?: string;
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  address_components: AddressComponent[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface PlaceDetailsResponse {
  result: PlaceDetailsResult;
  status: string;
  error_message?: string;
}

/**
 * Google Places Service for enriching venue data
 *
 * Uses the Nearby Search API to find places near coordinates,
 * then optionally fetches Place Details for more accurate address components.
 *
 * Includes request deduplication to avoid duplicate API calls when
 * multiple events with the same coordinates are processed concurrently.
 */
export class GooglePlacesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  /**
   * In-flight request cache for deduplication
   * Key: "lat,lng,radius" (rounded coordinates to handle minor variations)
   * Value: Promise that resolves to the API result
   */
  private readonly inFlightRequests = new Map<
    string,
    Promise<GooglePlaceResult | null>
  >();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GOOGLE_PLACES_API_KEY || '';

    if (!this.apiKey) {
      logger.warn(
        'GooglePlacesService initialized without API key - venue enrichment will be disabled',
      );
    }
  }

  /**
   * Generate a cache key from coordinates
   * Rounds to 5 decimal places (~1m precision) to handle minor coordinate variations
   */
  private getCacheKey(lat: number, lng: number, radiusMeters: number): string {
    const roundedLat = lat.toFixed(5);
    const roundedLng = lng.toFixed(5);
    return `${roundedLat},${roundedLng},${radiusMeters}`;
  }

  /**
   * Check if the service is configured and ready to use
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Find a place near the given coordinates
   *
   * Uses Nearby Search to find establishments near the location.
   * Optionally filters by venue name for better matching.
   *
   * Includes request deduplication - if multiple callers request the same
   * coordinates concurrently, only one API call is made.
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @param venueName - Optional venue name to help with matching
   * @param radiusMeters - Search radius (default: 100m)
   */
  async findNearbyPlace(
    lat: number,
    lng: number,
    venueName?: string,
    radiusMeters: number = 100,
  ): Promise<GooglePlaceResult | null> {
    if (!this.isConfigured()) {
      logger.debug('Google Places API not configured, skipping venue lookup');
      return null;
    }

    // Check for in-flight request with same coordinates
    const cacheKey = this.getCacheKey(lat, lng, radiusMeters);
    const inFlightRequest = this.inFlightRequests.get(cacheKey);

    if (inFlightRequest) {
      logger.debug('Deduplicating Google Places request - waiting for in-flight request', {
        lat,
        lng,
        radiusMeters,
        cacheKey,
      });
      return inFlightRequest;
    }

    // Create and cache the request promise
    const requestPromise = this.executeNearbySearch(lat, lng, venueName, radiusMeters);
    this.inFlightRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the cache after request completes (success or failure)
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Execute the actual Nearby Search API call
   */
  private async executeNearbySearch(
    lat: number,
    lng: number,
    venueName?: string,
    radiusMeters: number = 100,
  ): Promise<GooglePlaceResult | null> {
    try {
      // Build the Nearby Search URL with Spanish language for consistent results
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: radiusMeters.toString(),
        language: 'es', // Force Spanish for consistent city/country names
        key: this.apiKey,
      });

      // If we have a venue name, use it as a keyword to improve matching
      if (venueName) {
        params.set('keyword', venueName);
      }

      const nearbyUrl = `${this.baseUrl}/nearbysearch/json?${params}`;

      logger.debug('Google Places Nearby Search request', {
        lat,
        lng,
        venueName,
        radiusMeters,
      });

      const response = await fetch(nearbyUrl);
      const data: NearbySearchResponse = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        logger.error('Google Places Nearby Search API error', {
          status: data.status,
          error: data.error_message,
        });
        return null;
      }

      // Log all results for debugging
      logger.debug('Google Places Nearby Search response', {
        status: data.status,
        resultsCount: data.results.length,
        results: data.results.slice(0, 5).map(this.formatNearbyResultForLog),
      });

      if (data.results.length === 0) {
        logger.debug('No places found near coordinates', {lat, lng, venueName});
        return null;
      }

      // Get the first (most relevant) result
      const place = data.results[0];

      // Fetch place details to get proper address components
      const details = await this.getPlaceDetails(place.place_id);

      if (!details) {
        // Fall back to basic data from nearby search
        const fallbackResult: GooglePlaceResult = {
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity,
          city: this.extractCityFromVicinity(place.vicinity),
          country: 'Uruguay', // Default for our use case
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        };

        logger.debug('Using fallback from Nearby Search (no details)', {
          result: fallbackResult,
        });

        return fallbackResult;
      }

      return details;
    } catch (error) {
      logger.error('Error calling Google Places API', {error});
      return null;
    }
  }

  /**
   * Format nearby search result for logging (avoid logging sensitive data)
   */
  private formatNearbyResultForLog(result: NearbySearchResult) {
    return {
      placeId: result.place_id,
      name: result.name,
      vicinity: result.vicinity,
      types: result.types,
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      businessStatus: result.business_status,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
    };
  }

  /**
   * Get detailed place information including address components
   */
  private async getPlaceDetails(
    placeId: string,
  ): Promise<GooglePlaceResult | null> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields:
          'place_id,name,formatted_address,address_components,geometry/location',
        language: 'es', // Force Spanish for consistent city/country names
        key: this.apiKey,
      });

      const detailsUrl = `${this.baseUrl}/details/json?${params}`;

      const response = await fetch(detailsUrl);
      const data: PlaceDetailsResponse = await response.json();

      if (data.status !== 'OK') {
        logger.error('Google Places Details API error', {
          status: data.status,
          error: data.error_message,
          placeId,
        });
        return null;
      }

      const result = data.result;

      // Log full response for debugging
      logger.debug('Google Places Details response', {
        placeId: result.place_id,
        name: result.name,
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components.map(
          (c: AddressComponent) => ({
            longName: c.long_name,
            shortName: c.short_name,
            types: c.types,
          }),
        ),
        location: result.geometry.location,
      });

      // Extract city and country from address components
      let city = '';
      let country = 'Uruguay';
      let locality = '';
      let adminArea1 = '';
      let adminArea2 = '';

      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          locality = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          adminArea1 = component.long_name;
        }
        if (component.types.includes('administrative_area_level_2')) {
          adminArea2 = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      // Prefer locality > adminArea2 > adminArea1 for city
      city = locality || adminArea2 || adminArea1;

      // Fallback: extract city from formatted address if not found
      if (!city) {
        city = this.extractCityFromAddress(result.formatted_address);
      }

      const finalResult: GooglePlaceResult = {
        placeId: result.place_id,
        name: result.name,
        address: result.formatted_address,
        city,
        country,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      };

      logger.debug('Google Places final enriched venue', {
        result: finalResult,
        citySource: locality
          ? 'locality'
          : adminArea2
            ? 'adminArea2'
            : adminArea1
              ? 'adminArea1'
              : 'fallback',
      });

      return finalResult;
    } catch (error) {
      logger.error('Error fetching place details', {error, placeId});
      return null;
    }
  }

  /**
   * Extract city name from vicinity string (fallback method)
   * Vicinity format is typically "Street, City"
   */
  private extractCityFromVicinity(vicinity: string): string {
    const parts = vicinity.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 1].trim();
    }
    return vicinity.trim();
  }

  /**
   * Extract city name from formatted address (fallback method)
   * Address format is typically "Street Number, Street, City, Department, Country"
   */
  private extractCityFromAddress(address: string): string {
    const parts = address.split(',');
    // City is usually the third-to-last component before department and country
    if (parts.length >= 3) {
      return parts[parts.length - 3].trim();
    }
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return 'Unknown';
  }
}

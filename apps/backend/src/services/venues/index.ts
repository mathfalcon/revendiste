import {VenuesRepository} from '~/repositories';
import {GooglePlacesService} from '~/services/google-places';
import {logger} from '~/utils';

/**
 * How often to refresh venue data from Google Places API (in days)
 * Even if a venue exists, we'll call Google again if it hasn't been updated recently
 */
const VENUE_REFRESH_DAYS = 7;

/**
 * VenuesService orchestrates venue lookup and creation
 *
 * Flow:
 * 1. Check if venue exists by coordinates (within ~100m radius)
 * 2. If found and recently updated, return existing venue
 * 3. If found but stale (older than VENUE_REFRESH_DAYS), refresh from Google Places
 * 4. If not found, call Google Places API to get enriched data
 * 5. Check if venue exists by googlePlaceId (handles coordinate variations)
 * 6. Create new venue with enriched data
 * 7. Return venue ID
 */
export class VenuesService {
  /**
   * Session-level cache: googlePlaceId → venueId
   * Prevents redundant DB lookups and race conditions within a single scraping run
   */
  private readonly resolvedPlaceIds = new Map<string, string>();

  constructor(
    private readonly venuesRepository: VenuesRepository,
    private readonly googlePlacesService: GooglePlacesService,
  ) {}

  /**
   * Find or create a venue based on coordinates and optional name
   *
   * @param scrapedVenueName - Name from the scraper (e.g., "Soho Punta del Este")
   * @param scrapedVenueAddress - Address from the scraper
   * @param lat - Latitude from the scraper (can be undefined if not available)
   * @param lng - Longitude from the scraper (can be undefined if not available)
   * @returns Venue ID (always creates a venue, even without coordinates)
   */
  async findOrCreateVenue(
    scrapedVenueName: string | undefined,
    scrapedVenueAddress: string,
    lat: number | undefined,
    lng: number | undefined,
  ): Promise<string | null> {
    // If coordinates are provided, use the coordinate-based flow
    if (lat && lng) {
      return this.findOrCreateVenueWithCoordinates(
        scrapedVenueName,
        scrapedVenueAddress,
        lat,
        lng,
      );
    }

    // No coordinates - try to find/create venue by name and address
    return this.findOrCreateVenueWithoutCoordinates(
      scrapedVenueName,
      scrapedVenueAddress,
    );
  }

  /**
   * Find or create venue when coordinates ARE available
   * Uses coordinate-based lookup and Google Places enrichment
   */
  private async findOrCreateVenueWithCoordinates(
    scrapedVenueName: string | undefined,
    scrapedVenueAddress: string,
    lat: number,
    lng: number,
  ): Promise<string | null> {
    // 1. Check for existing venue by coordinates (within 100m)
    const nearbyVenues = await this.venuesRepository.findByCoordinates(
      lat,
      lng,
      100,
    );

    if (nearbyVenues.length > 0) {
      const existingVenue = nearbyVenues[0];
      const isStale = this.isVenueStale(existingVenue.updatedAt);

      logger.debug('Found existing venue by coordinates', {
        venueId: existingVenue.id,
        venueName: existingVenue.name,
        distance: existingVenue.distanceMeters,
        isStale,
        updatedAt: existingVenue.updatedAt,
      });

      // Populate session cache for future lookups
      if (existingVenue.googlePlaceId) {
        this.resolvedPlaceIds.set(existingVenue.googlePlaceId, existingVenue.id);
      }

      // If venue data is fresh, return it immediately
      if (!isStale) {
        return existingVenue.id;
      }

      // Venue is stale - try to refresh from Google Places
      const refreshedVenue = await this.refreshVenueFromGoogle(
        existingVenue.id,
        lat,
        lng,
        scrapedVenueName,
      );

      return refreshedVenue?.id ?? existingVenue.id;
    }

    // 2. Try to enrich with Google Places API
    const placeResult = await this.googlePlacesService.findNearbyPlace(
      lat,
      lng,
      scrapedVenueName,
      150, // Slightly larger radius for API search
    );

    // 3. If Google Places found a place, check session cache and DB by placeId
    if (placeResult?.placeId) {
      // Check session cache first (avoids DB roundtrip for venues already resolved this run)
      const cachedVenueId = this.resolvedPlaceIds.get(placeResult.placeId);
      if (cachedVenueId) {
        logger.debug('Found venue in session cache by Google Place ID', {
          venueId: cachedVenueId,
          googlePlaceId: placeResult.placeId,
        });
        return cachedVenueId;
      }

      const existingByPlaceId = await this.venuesRepository.findByGooglePlaceId(
        placeResult.placeId,
      );

      if (existingByPlaceId) {
        this.resolvedPlaceIds.set(placeResult.placeId, existingByPlaceId.id);
        logger.debug('Found existing venue by Google Place ID', {
          venueId: existingByPlaceId.id,
          venueName: existingByPlaceId.name,
          googlePlaceId: placeResult.placeId,
        });
        return existingByPlaceId.id;
      }
    }

    // 4. Create new venue with enriched or scraped data
    const venueData = placeResult
      ? {
          name: placeResult.name,
          address: placeResult.address,
          city: placeResult.city,
          region: placeResult.region || null,
          country: placeResult.country,
          googlePlaceId: placeResult.placeId,
          latitude: placeResult.latitude.toString(),
          longitude: placeResult.longitude.toString(),
        }
      : {
          name: scrapedVenueName || 'Venue desconocido',
          address: scrapedVenueAddress,
          city: this.extractCityFromAddress(scrapedVenueAddress),
          region: null,
          country: 'Uruguay',
          googlePlaceId: null,
          latitude: lat.toString(),
          longitude: lng.toString(),
        };

    // Use conflict-safe insert when we have a placeId to handle concurrent creation races
    const newVenue = placeResult
      ? await this.venuesRepository.createOrFindByPlaceId(venueData)
      : await this.venuesRepository.create(venueData);

    if (newVenue.googlePlaceId) {
      this.resolvedPlaceIds.set(newVenue.googlePlaceId, newVenue.id);
    }

    logger.info('Created new venue', {
      venueId: newVenue.id,
      venueName: newVenue.name,
      city: newVenue.city,
      enrichedWithGoogle: !!placeResult,
    });

    return newVenue.id;
  }

  /**
   * Find or create venue when coordinates are NOT available
   * Uses name and address for deduplication, creates venue without coordinates
   */
  private async findOrCreateVenueWithoutCoordinates(
    scrapedVenueName: string | undefined,
    scrapedVenueAddress: string,
  ): Promise<string | null> {
    const venueName = scrapedVenueName || scrapedVenueAddress || 'Venue desconocido';

    logger.debug('No coordinates provided, attempting to find/create venue by name', {
      scrapedVenueName,
      scrapedVenueAddress,
    });

    // 1. Try to find existing venue by name and address (fuzzy match)
    const existingVenue = await this.venuesRepository.findByNameAndAddress(
      venueName,
      scrapedVenueAddress,
    );

    if (existingVenue) {
      logger.debug('Found existing venue by name/address', {
        venueId: existingVenue.id,
        venueName: existingVenue.name,
      });
      return existingVenue.id;
    }

    // 2. Create new venue without coordinates
    const venueData = {
      name: venueName,
      address: scrapedVenueAddress,
      city: this.extractCityFromAddress(scrapedVenueAddress),
      country: 'Uruguay',
      googlePlaceId: null,
      latitude: null,
      longitude: null,
    };

    const newVenue = await this.venuesRepository.create(venueData);

    logger.info('Created new venue without coordinates', {
      venueId: newVenue.id,
      venueName: newVenue.name,
      city: newVenue.city,
      address: newVenue.address,
    });

    return newVenue.id;
  }

  /**
   * Check if a venue's data is stale and needs refreshing
   */
  private isVenueStale(updatedAt: Date): boolean {
    const staleThresholdMs = VENUE_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    const now = new Date();
    const lastUpdate = new Date(updatedAt);
    return now.getTime() - lastUpdate.getTime() > staleThresholdMs;
  }

  /**
   * Refresh venue data from Google Places API
   * Only updates if Google returns valid data
   */
  private async refreshVenueFromGoogle(
    venueId: string,
    lat: number,
    lng: number,
    venueName?: string,
  ) {
    logger.debug('Refreshing stale venue from Google Places', {
      venueId,
      lat,
      lng,
      venueName,
    });

    const placeResult = await this.googlePlacesService.findNearbyPlace(
      lat,
      lng,
      venueName,
      150,
    );

    if (!placeResult) {
      // No Google result - just touch updatedAt to avoid repeated API calls
      logger.debug('No Google Places result for refresh, updating timestamp', {
        venueId,
      });
      return await this.venuesRepository.updateVenue(venueId, {});
    }

    // Check if the new placeId is already owned by a different venue
    if (placeResult.placeId) {
      const existingWithPlaceId = await this.venuesRepository.findByGooglePlaceId(
        placeResult.placeId,
      );

      if (existingWithPlaceId && existingWithPlaceId.id !== venueId) {
        // Another venue already owns this placeId — return that one instead of updating
        logger.info('Refresh found existing venue with same Google Place ID, deduplicating', {
          staleVenueId: venueId,
          existingVenueId: existingWithPlaceId.id,
          googlePlaceId: placeResult.placeId,
        });
        this.resolvedPlaceIds.set(placeResult.placeId, existingWithPlaceId.id);
        return existingWithPlaceId;
      }
    }

    // Update venue with fresh Google Places data
    const updatedVenue = await this.venuesRepository.updateVenue(venueId, {
      name: placeResult.name,
      address: placeResult.address,
      city: placeResult.city,
      region: placeResult.region || null,
      country: placeResult.country,
      googlePlaceId: placeResult.placeId,
      latitude: placeResult.latitude.toString(),
      longitude: placeResult.longitude.toString(),
    });

    if (updatedVenue?.googlePlaceId) {
      this.resolvedPlaceIds.set(updatedVenue.googlePlaceId, updatedVenue.id);
    }

    logger.info('Refreshed venue from Google Places', {
      venueId,
      venueName: updatedVenue?.name,
      city: updatedVenue?.city,
      region: updatedVenue?.region ?? '(null)',
    });

    return updatedVenue;
  }

  /**
   * Get all distinct cities for filtering
   */
  async getDistinctCities(): Promise<string[]> {
    return await this.venuesRepository.getDistinctCities();
  }

  /**
   * Get distinct regions with active events, grouped by country
   */
  async getDistinctRegions() {
    return await this.venuesRepository.getDistinctRegions();
  }

  /**
   * Extract city from address string (fallback when no Google Places data)
   * Attempts to parse common Uruguayan address formats
   */
  private extractCityFromAddress(address: string): string {
    // Common Uruguayan cities to look for
    const commonCities = [
      'Montevideo',
      'Punta del Este',
      'Maldonado',
      'Colonia del Sacramento',
      'Salto',
      'Paysandú',
      'Rivera',
      'Las Piedras',
      'Ciudad de la Costa',
      'Atlántida',
      'Piriápolis',
      'Rocha',
      'La Paloma',
      'José Ignacio',
      'Manantiales',
    ];

    const lowerAddress = address.toLowerCase();

    for (const city of commonCities) {
      if (lowerAddress.includes(city.toLowerCase())) {
        return city;
      }
    }

    // Try to extract from comma-separated parts
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 1].trim();
    }

    return 'Uruguay';
  }
}

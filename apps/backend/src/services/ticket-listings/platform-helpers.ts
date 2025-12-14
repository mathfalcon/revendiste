import {UploadAvailability} from './types';

/**
 * Determine if a document can be uploaded for a ticket based on platform rules
 * and event timing.
 *
 * Platform-specific rules:
 * - "entraste": Tickets are only available 12 hours before event start
 * - Future platforms can be added here
 */
export function canUploadDocumentForPlatform(
  platform: string,
  eventStartDate: Date,
  eventEndDate: Date,
  hasDocument: boolean,
): UploadAvailability {
  const now = new Date();

  // Can't upload after event has ended
  if (now > eventEndDate) {
    return {
      canUpload: false,
      reason: 'event_ended',
    };
  }

  // Platform-specific logic
  switch (platform.toLowerCase()) {
    // case 'entraste': { TODO: Add back in when Entraste is live
    //   // For Entraste, QR codes are available 12 hours before event start
    //   const hoursBeforeEvent = 12;
    //   const uploadAvailableAt = new Date(eventStartDate);
    //   uploadAvailableAt.setHours(uploadAvailableAt.getHours() - hoursBeforeEvent);

    //   if (now < uploadAvailableAt) {
    //     return {
    //       canUpload: false,
    //       reason: 'too_early',
    //     };
    //   }

    //   return {
    //     canUpload: true,
    //   };
    // }

    // Add more platforms here as needed
    // case 'other_platform':
    //   return { canUpload: true };

    default:
      // Default behavior: allow upload anytime before event ends
      return {
        canUpload: true,
      };
  }
}

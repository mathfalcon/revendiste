import {
  MILESTONE_THRESHOLDS,
  getNotificationMilestone,
  resolveDocumentReminderMilestone,
  shouldSendDocumentReminder,
  parseQrAvailabilityTiming,
  calculateHoursUntilEvent,
  getApplicableMilestones,
} from '~/utils/document-reminder';

describe('Document Reminder Utilities', () => {
  describe('MILESTONE_THRESHOLDS', () => {
    it('should have the correct milestone values', () => {
      expect(MILESTONE_THRESHOLDS).toEqual([72, 48, 24, 12, 6, 3, 2, 1]);
    });

    it('should be in descending order', () => {
      for (let i = 0; i < MILESTONE_THRESHOLDS.length - 1; i++) {
        expect(MILESTONE_THRESHOLDS[i]).toBeGreaterThan(
          MILESTONE_THRESHOLDS[i + 1],
        );
      }
    });
  });

  describe('getNotificationMilestone', () => {
    describe('exact milestone times', () => {
      it.each(MILESTONE_THRESHOLDS)(
        'should return %i when exactly at %i hours',
        milestone => {
          expect(getNotificationMilestone(milestone)).toBe(milestone);
        },
      );
    });

    describe('±30 minute window', () => {
      it.each(MILESTONE_THRESHOLDS)(
        'should return %i when 30 minutes before milestone (%i - 0.5)',
        milestone => {
          expect(getNotificationMilestone(milestone - 0.5)).toBe(milestone);
        },
      );

      it('should return correct milestone when 30 minutes after each milestone', () => {
        // At window boundaries where milestones overlap, the larger one wins
        // because we iterate from largest to smallest
        expect(getNotificationMilestone(72 + 0.5)).toBe(72); // 72.5 is only in 72h window
        expect(getNotificationMilestone(48 + 0.5)).toBe(48); // 48.5 is only in 48h window
        expect(getNotificationMilestone(24 + 0.5)).toBe(24); // 24.5 is only in 24h window
        expect(getNotificationMilestone(12 + 0.5)).toBe(12); // 12.5 is only in 12h window
        expect(getNotificationMilestone(6 + 0.5)).toBe(6); // 6.5 is only in 6h window
        // Note: 3.5 is at boundary of 3h window end (3+0.5=3.5) - in 3h window
        expect(getNotificationMilestone(3 + 0.5)).toBe(3);
        // Note: 2.5 is at boundary of both 3h window start (3-0.5=2.5) and 2h window end (2+0.5=2.5)
        // Since we iterate largest to smallest, 3h wins
        expect(getNotificationMilestone(2 + 0.5)).toBe(3);
        // Note: 1.5 is at boundary of both 2h window start (2-0.5=1.5) and 1h window end (1+0.5=1.5)
        // Since we iterate largest to smallest, 2h wins
        expect(getNotificationMilestone(1 + 0.5)).toBe(2);
      });

      it.each(MILESTONE_THRESHOLDS)(
        'should return %i when 15 minutes before milestone (%i - 0.25)',
        milestone => {
          expect(getNotificationMilestone(milestone - 0.25)).toBe(milestone);
        },
      );
    });

    describe('outside milestone windows', () => {
      it('should return null when between 72h and 48h milestones', () => {
        expect(getNotificationMilestone(60)).toBeNull();
      });

      it('should return null when between 48h and 24h milestones', () => {
        expect(getNotificationMilestone(36)).toBeNull();
      });

      it('should return null when between 24h and 12h milestones', () => {
        expect(getNotificationMilestone(18)).toBeNull();
      });

      it('should return null when between 12h and 6h milestones', () => {
        expect(getNotificationMilestone(9)).toBeNull();
      });

      it('should return null when between 6h and 3h milestones', () => {
        expect(getNotificationMilestone(4.5)).toBeNull();
      });

      it('should return 3 at 2.6 (overlapping window boundary)', () => {
        // 2.6 is within 3h window (2.5 to 3.5), so it returns 3
        expect(getNotificationMilestone(2.6)).toBe(3);
      });

      it('should return 2 at 1.6 (overlapping window boundary)', () => {
        // 1.6 is within 2h window (1.5 to 2.5), so it returns 2
        expect(getNotificationMilestone(1.6)).toBe(2);
      });

      it('should return null when less than 0.5 hours (30 min) before event', () => {
        expect(getNotificationMilestone(0.4)).toBeNull();
      });

      it('should return null when more than 72.5 hours before event', () => {
        expect(getNotificationMilestone(73)).toBeNull();
      });

      it('should return null for negative hours (event has passed)', () => {
        expect(getNotificationMilestone(-1)).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle exactly 0 hours', () => {
        expect(getNotificationMilestone(0)).toBeNull();
      });

      it('should handle very large values', () => {
        expect(getNotificationMilestone(1000)).toBeNull();
      });

      it('should handle decimal values at window boundaries', () => {
        // Just inside 24h window (24 - 0.5 = 23.5)
        expect(getNotificationMilestone(23.5)).toBe(24);
        // Just outside 24h window
        expect(getNotificationMilestone(23.4)).toBeNull();
      });
    });
  });

  describe('shouldSendDocumentReminder', () => {
    describe('events WITHOUT qrAvailabilityTiming (null)', () => {
      it.each(MILESTONE_THRESHOLDS)(
        'should return true at %i hour milestone',
        milestone => {
          expect(shouldSendDocumentReminder(milestone, null)).toBe(true);
        },
      );

      it('should return false between milestones', () => {
        expect(shouldSendDocumentReminder(36, null)).toBe(false);
        expect(shouldSendDocumentReminder(18, null)).toBe(false);
        expect(shouldSendDocumentReminder(9, null)).toBe(false);
      });
    });

    describe('events WITH qrAvailabilityTiming', () => {
      describe('qrAvailabilityTiming = 48h', () => {
        const qrWindow = 48;

        it('should return true at 48h milestone (at window start)', () => {
          expect(shouldSendDocumentReminder(48, qrWindow)).toBe(true);
        });

        it('should return true at milestones within window (24, 12, 6, 3, 2, 1)', () => {
          expect(shouldSendDocumentReminder(24, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(12, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(6, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(3, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(2, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(1, qrWindow)).toBe(true);
        });

        it('should return false at 72h milestone (before window)', () => {
          expect(shouldSendDocumentReminder(72, qrWindow)).toBe(false);
        });
      });

      describe('qrAvailabilityTiming = 12h', () => {
        const qrWindow = 12;

        it('should return true at 12h milestone (at window start)', () => {
          expect(shouldSendDocumentReminder(12, qrWindow)).toBe(true);
        });

        it('should return true at milestones within window (6, 3, 2, 1)', () => {
          expect(shouldSendDocumentReminder(6, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(3, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(2, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(1, qrWindow)).toBe(true);
        });

        it('should return false at milestones before window (72, 48, 24)', () => {
          expect(shouldSendDocumentReminder(72, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(48, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(24, qrWindow)).toBe(false);
        });
      });

      describe('qrAvailabilityTiming = 6h', () => {
        const qrWindow = 6;

        it('should return true at 6h milestone (at window start)', () => {
          expect(shouldSendDocumentReminder(6, qrWindow)).toBe(true);
        });

        it('should return true at milestones within window (3, 2, 1)', () => {
          expect(shouldSendDocumentReminder(3, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(2, qrWindow)).toBe(true);
          expect(shouldSendDocumentReminder(1, qrWindow)).toBe(true);
        });

        it('should return false at milestones before window (72, 48, 24, 12)', () => {
          expect(shouldSendDocumentReminder(72, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(48, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(24, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(12, qrWindow)).toBe(false);
        });
      });

      describe('qrAvailabilityTiming = 1h (minimum)', () => {
        const qrWindow = 1;

        it('should return true only at 1h milestone', () => {
          expect(shouldSendDocumentReminder(1, qrWindow)).toBe(true);
        });

        it('should return false at all other milestones', () => {
          expect(shouldSendDocumentReminder(72, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(48, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(24, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(12, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(6, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(3, qrWindow)).toBe(false);
          expect(shouldSendDocumentReminder(2, qrWindow)).toBe(false);
        });
      });
    });

    describe('real-world scenarios', () => {
      it('event in 1h 5min (1.08 hours), no QR window - should trigger 1h milestone', () => {
        expect(shouldSendDocumentReminder(1.08, null)).toBe(true);
      });

      it('event in 1h 5min (1.08 hours), 12h QR window - should trigger 1h milestone', () => {
        expect(shouldSendDocumentReminder(1.08, 12)).toBe(true);
      });

      it('event in 11h 45min (11.75 hours), 12h QR window - should trigger 12h milestone', () => {
        expect(shouldSendDocumentReminder(11.75, 12)).toBe(true);
      });

      it('event in 47h 40min (47.67 hours), no QR window - should trigger 48h milestone', () => {
        expect(shouldSendDocumentReminder(47.67, null)).toBe(true);
      });

      it('event in 5 hours, 12h QR window - catch-up inside upload window (missed 12h ±30m band)', () => {
        expect(shouldSendDocumentReminder(5, 12)).toBe(true);
        expect(resolveDocumentReminderMilestone(5, 12)).toBe(12);
      });

      it('6h QR window, ~4.33h before event - catch-up uses 6h milestone for dedupe', () => {
        expect(shouldSendDocumentReminder(4.338, 6)).toBe(true);
        expect(resolveDocumentReminderMilestone(4.338, 6)).toBe(6);
      });
    });
  });

  describe('resolveDocumentReminderMilestone', () => {
    it('returns null outside QR window when QR is set', () => {
      expect(resolveDocumentReminderMilestone(8, 6)).toBeNull();
    });

    it('narrow band still wins before catch-up', () => {
      expect(resolveDocumentReminderMilestone(6, 6)).toBe(6);
    });
  });

  describe('parseQrAvailabilityTiming', () => {
    it('should parse "12h" to 12', () => {
      expect(parseQrAvailabilityTiming('12h')).toBe(12);
    });

    it('should parse "48h" to 48', () => {
      expect(parseQrAvailabilityTiming('48h')).toBe(48);
    });

    it('should parse "1h" to 1', () => {
      expect(parseQrAvailabilityTiming('1h')).toBe(1);
    });

    it('should parse "72h" to 72', () => {
      expect(parseQrAvailabilityTiming('72h')).toBe(72);
    });

    it('should return null for null input', () => {
      expect(parseQrAvailabilityTiming(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseQrAvailabilityTiming(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseQrAvailabilityTiming('')).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(parseQrAvailabilityTiming('invalid')).toBeNull();
      expect(parseQrAvailabilityTiming('abc')).toBeNull();
    });

    it('should handle numbers without "h" suffix', () => {
      // parseInt will still work on "12" -> 12
      expect(parseQrAvailabilityTiming('12')).toBe(12);
    });
  });

  describe('calculateHoursUntilEvent', () => {
    it('should calculate hours correctly for future event', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const eventStart = new Date('2024-01-15T22:00:00Z'); // 12 hours later

      expect(calculateHoursUntilEvent(eventStart, now)).toBe(12);
    });

    it('should return negative for past event', () => {
      const now = new Date('2024-01-15T22:00:00Z');
      const eventStart = new Date('2024-01-15T10:00:00Z'); // 12 hours earlier

      expect(calculateHoursUntilEvent(eventStart, now)).toBe(-12);
    });

    it('should return 0 for event starting now', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const eventStart = new Date('2024-01-15T10:00:00Z');

      expect(calculateHoursUntilEvent(eventStart, now)).toBe(0);
    });

    it('should handle fractional hours', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const eventStart = new Date('2024-01-15T11:30:00Z'); // 1.5 hours later

      expect(calculateHoursUntilEvent(eventStart, now)).toBe(1.5);
    });

    it('should handle minutes correctly', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const eventStart = new Date('2024-01-15T10:15:00Z'); // 15 minutes later

      expect(calculateHoursUntilEvent(eventStart, now)).toBe(0.25);
    });

    it('should handle multi-day differences', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const eventStart = new Date('2024-01-18T10:00:00Z'); // 3 days later

      expect(calculateHoursUntilEvent(eventStart, now)).toBe(72);
    });
  });

  describe('getApplicableMilestones', () => {
    it('should return all milestones when qrAvailabilityHours is null', () => {
      expect(getApplicableMilestones(null)).toEqual([72, 48, 24, 12, 6, 3, 2, 1]);
    });

    it('should return milestones <= 48 when qrAvailabilityHours is 48', () => {
      expect(getApplicableMilestones(48)).toEqual([48, 24, 12, 6, 3, 2, 1]);
    });

    it('should return milestones <= 24 when qrAvailabilityHours is 24', () => {
      expect(getApplicableMilestones(24)).toEqual([24, 12, 6, 3, 2, 1]);
    });

    it('should return milestones <= 12 when qrAvailabilityHours is 12', () => {
      expect(getApplicableMilestones(12)).toEqual([12, 6, 3, 2, 1]);
    });

    it('should return milestones <= 6 when qrAvailabilityHours is 6', () => {
      expect(getApplicableMilestones(6)).toEqual([6, 3, 2, 1]);
    });

    it('should return milestones <= 3 when qrAvailabilityHours is 3', () => {
      expect(getApplicableMilestones(3)).toEqual([3, 2, 1]);
    });

    it('should return milestones <= 2 when qrAvailabilityHours is 2', () => {
      expect(getApplicableMilestones(2)).toEqual([2, 1]);
    });

    it('should return only [1] when qrAvailabilityHours is 1', () => {
      expect(getApplicableMilestones(1)).toEqual([1]);
    });

    it('should return empty array when qrAvailabilityHours is 0', () => {
      expect(getApplicableMilestones(0)).toEqual([]);
    });

    it('should handle non-milestone values (e.g., 36h)', () => {
      // 36 is between 48 and 24, so only milestones 24, 12, 6, 3, 2, 1 apply
      expect(getApplicableMilestones(36)).toEqual([24, 12, 6, 3, 2, 1]);
    });

    it('should handle 72h (all milestones apply)', () => {
      expect(getApplicableMilestones(72)).toEqual([72, 48, 24, 12, 6, 3, 2, 1]);
    });

    it('should handle values larger than 72h', () => {
      expect(getApplicableMilestones(100)).toEqual([72, 48, 24, 12, 6, 3, 2, 1]);
    });
  });

  describe('integration scenarios', () => {
    it('should correctly determine notification timing for user scenario: event in 1h 5min, no QR window, 7 tickets', () => {
      const hoursUntilEvent = 1.08; // 1 hour and 5 minutes
      const qrAvailabilityHours = null; // No QR restriction

      // Should find the 1h milestone
      const milestone = getNotificationMilestone(hoursUntilEvent);
      expect(milestone).toBe(1);

      // Should determine that a reminder should be sent
      const shouldSend = shouldSendDocumentReminder(
        hoursUntilEvent,
        qrAvailabilityHours,
      );
      expect(shouldSend).toBe(true);

      // All milestones are applicable
      const applicableMilestones = getApplicableMilestones(qrAvailabilityHours);
      expect(applicableMilestones).toContain(1);
    });

    it('should correctly handle an event with 12h QR window when at different times', () => {
      const qrWindow = 12;
      const applicableMilestones = getApplicableMilestones(qrWindow);

      // Should only have 12, 6, 3, 2, 1
      expect(applicableMilestones).toEqual([12, 6, 3, 2, 1]);

      // At 24 hours - should NOT trigger (before QR window)
      expect(shouldSendDocumentReminder(24, qrWindow)).toBe(false);

      // At 12 hours - should trigger
      expect(shouldSendDocumentReminder(12, qrWindow)).toBe(true);

      // At 6 hours - should trigger
      expect(shouldSendDocumentReminder(6, qrWindow)).toBe(true);

      // At 1 hour - should trigger
      expect(shouldSendDocumentReminder(1, qrWindow)).toBe(true);
    });
  });
});

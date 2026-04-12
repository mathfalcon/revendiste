import {queryOptions} from '@tanstack/react-query';
import {api, PaginationQuery, UpdatePayoutRouteBody} from '../';

export interface AdminPayoutsQueryParams extends PaginationQuery {
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export const adminPayoutsQueryOptions = (params: AdminPayoutsQueryParams) => {
  return queryOptions({
    queryKey: ['admin', 'payouts', params],
    queryFn: async () => {
      const response = await api.admin.getPayouts({
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        status: params.status,
      });
      return response.data;
    },
  });
};

export const adminPayoutDetailsQueryOptions = (payoutId: string) => {
  return queryOptions({
    queryKey: ['admin', 'payouts', payoutId],
    queryFn: async () => {
      const response = await api.admin.getPayoutDetails(payoutId);
      return response.data;
    },
  });
};

export const updatePayoutMutation = () => {
  return {
    mutationFn: async ({
      payoutId,
      updates,
    }: {
      payoutId: string;
      updates: UpdatePayoutRouteBody;
    }) => {
      const response = await api.admin.updatePayout(payoutId, updates);
      return response.data;
    },
  };
};

export const processPayoutMutation = () => {
  return {
    mutationFn: async ({
      payoutId,
      updates,
    }: {
      payoutId: string;
      updates: {
        processingFee?: number;
        transactionReference?: string;
        notes?: string;
        voucherUrl?: string;
      };
    }) => {
      // Ensure we always send at least an empty object
      const body = Object.keys(updates).length > 0 ? updates : {};
      const response = await api.admin.processPayout(payoutId, body);
      return response.data;
    },
  };
};

export const completePayoutMutation = () => {
  return {
    mutationFn: async ({
      payoutId,
      options,
    }: {
      payoutId: string;
      options?: {
        transactionReference?: string;
        voucherUrl?: string;
      };
    }) => {
      const response = await api.admin.completePayout(payoutId, options || {});
      return response.data;
    },
  };
};

export const failPayoutMutation = () => {
  return {
    mutationFn: async ({
      payoutId,
      failureReason,
    }: {
      payoutId: string;
      failureReason: string;
    }) => {
      const response = await api.admin.failPayout(payoutId, {failureReason});
      return response.data;
    },
  };
};

export const cancelPayoutMutation = () => {
  return {
    mutationFn: async ({
      payoutId,
      reasonType,
      failureReason,
    }: {
      payoutId: string;
      reasonType: 'error' | 'other';
      failureReason: string;
    }) => {
      const response = await api.admin.cancelPayout(payoutId, {
        reasonType,
        failureReason,
      });
      return response.data;
    },
  };
};

export const uploadPayoutDocumentMutation = () => {
  return {
    mutationFn: async ({payoutId, file}: {payoutId: string; file: File}) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.admin.uploadPayoutDocument(
        payoutId,
        {file},
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    },
  };
};

export const deletePayoutDocumentMutation = () => {
  return {
    mutationFn: async ({documentId}: {documentId: string}) => {
      const response = await api.admin.deletePayoutDocument(documentId);
      return response.data;
    },
  };
};

export const triggerHoldCheckMutation = () => {
  return {
    mutationFn: async () => {
      const response = await api.admin.triggerHoldCheck();
      return response.data;
    },
  };
};

// ============================================================================
// Identity Verification Admin
// ============================================================================

export interface AdminVerificationsQueryParams extends PaginationQuery {
  status?: 'requires_manual_review' | 'pending' | 'failed' | 'completed';
}

export const adminVerificationsQueryOptions = (
  params: AdminVerificationsQueryParams,
) => {
  return queryOptions({
    queryKey: ['admin', 'verifications', params],
    queryFn: async () => {
      const response = await api.admin.getVerifications({
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy as
          | 'createdAt'
          | 'updatedAt'
          | 'verificationAttempts',
        sortOrder: params.sortOrder,
        status: params.status,
      });
      return response.data;
    },
  });
};

export const adminVerificationDetailsQueryOptions = (userId: string) => {
  return queryOptions({
    queryKey: ['admin', 'verifications', userId],
    queryFn: async () => {
      const response = await api.admin.getVerificationDetails(userId);
      return response.data;
    },
  });
};

export const adminVerificationImageQueryOptions = (
  userId: string,
  imageType: 'document' | 'reference' | 'audit',
  index?: number,
) => {
  return queryOptions({
    queryKey: ['admin', 'verifications', userId, 'images', imageType, index],
    queryFn: async () => {
      const response = await api.admin.getVerificationImage(userId, imageType, {
        index: index?.toString(),
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (images don't change)
    gcTime: 15 * 60 * 1000, // 15 minutes (match signed URL expiry)
  });
};

export const approveVerificationMutation = () => {
  return {
    mutationFn: async ({userId, notes}: {userId: string; notes?: string}) => {
      const response = await api.admin.approveVerification(userId, {notes});
      return response.data;
    },
  };
};

export const rejectVerificationMutation = () => {
  return {
    mutationFn: async ({userId, reason}: {userId: string; reason: string}) => {
      const response = await api.admin.rejectVerification(userId, {reason});
      return response.data;
    },
  };
};

// ============================================================================
// Events Admin
// ============================================================================

export interface AdminEventsQueryParams extends PaginationQuery {
  includePast?: boolean;
  search?: string;
  status?: 'active' | 'inactive';
}

export const adminEventsQueryOptions = (params: AdminEventsQueryParams) => {
  return queryOptions({
    queryKey: ['admin', 'events', params],
    queryFn: async () => {
      const response = await api.admin.getEvents({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        includePast: params.includePast ?? false,
        search: params.search,
        status: params.status,
      });
      return response.data;
    },
  });
};

export const adminEventDetailsQueryOptions = (eventId: string) => {
  return queryOptions({
    queryKey: ['admin', 'events', eventId],
    queryFn: async () => {
      const response = await api.admin.getEventDetails(eventId);
      return response.data;
    },
  });
};

export const updateEventMutation = () => {
  return {
    mutationFn: async ({
      eventId,
      updates,
    }: {
      eventId: string;
      updates: {
        name?: string;
        description?: string | null;
        eventStartDate?: string;
        eventEndDate?: string;
        venueName?: string | null;
        venueAddress?: string;
        externalUrl?: string;
        qrAvailabilityTiming?:
          | '3h'
          | '6h'
          | '12h'
          | '24h'
          | '48h'
          | '72h'
          | null;
        status?: 'active' | 'inactive';
      };
    }) => {
      const response = await api.admin.updateEvent(eventId, updates);
      return response.data;
    },
  };
};

export const deleteEventMutation = () => {
  return {
    mutationFn: async ({eventId}: {eventId: string}) => {
      const response = await api.admin.deleteEvent(eventId);
      return response.data;
    },
  };
};

// Ticket Waves

export const createTicketWaveMutation = () => {
  return {
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: {
        name: string;
        description?: string | null;
        faceValue: number;
        currency: 'UYU' | 'USD';
        isSoldOut: boolean;
        isAvailable: boolean;
        externalId?: string;
      };
    }) => {
      const response = await api.admin.createTicketWave(eventId, data);
      return response.data;
    },
  };
};

export const updateTicketWaveMutation = () => {
  return {
    mutationFn: async ({
      eventId,
      waveId,
      data,
    }: {
      eventId: string;
      waveId: string;
      data: {
        name?: string;
        description?: string | null;
        faceValue?: number;
        currency?: 'UYU' | 'USD';
        isSoldOut?: boolean;
        isAvailable?: boolean;
      };
    }) => {
      const response = await api.admin.updateTicketWave(eventId, waveId, data);
      return response.data;
    },
  };
};

export const deleteTicketWaveMutation = () => {
  return {
    mutationFn: async ({
      eventId,
      waveId,
    }: {
      eventId: string;
      waveId: string;
    }) => {
      const response = await api.admin.deleteTicketWave(eventId, waveId);
      return response.data;
    },
  };
};

// Event Images

export const uploadEventImageMutation = () => {
  return {
    mutationFn: async ({
      eventId,
      file,
      imageType,
    }: {
      eventId: string;
      file: File;
      imageType: 'flyer' | 'hero';
    }) => {
      const response = await api.admin.uploadEventImage(
        eventId,
        {file, imageType},
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    },
  };
};

export const deleteEventImageMutation = () => {
  return {
    mutationFn: async ({
      eventId,
      imageId,
    }: {
      eventId: string;
      imageId: string;
    }) => {
      const response = await api.admin.deleteEventImage(eventId, imageId);
      return response.data;
    },
  };
};

// ============================================================================
// Settlements Admin
// ============================================================================

export interface AdminSettlementsQueryParams extends PaginationQuery {
  status?: 'pending' | 'completed' | 'failed';
  paymentProvider?: 'dlocal' | 'mercadopago' | 'paypal' | 'stripe';
}

export const adminSettlementsQueryOptions = (
  params: AdminSettlementsQueryParams,
) => {
  return queryOptions({
    queryKey: ['admin', 'settlements', params],
    queryFn: async () => {
      const response = await api.admin.listSettlements({
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        status: params.status,
        paymentProvider: params.paymentProvider,
      });
      return response.data;
    },
  });
};

// Venues

export const searchVenuesQueryOptions = (query: string) => {
  return queryOptions({
    queryKey: ['admin', 'venues', 'search', query],
    queryFn: async () => {
      if (!query.trim()) {
        return [];
      }
      const response = await api.admin.searchVenues({q: query, limit: 20});
      return response.data;
    },
  });
};

export const adminSettlementDetailsQueryOptions = (settlementId: string) => {
  return queryOptions({
    queryKey: ['admin', 'settlements', settlementId],
    queryFn: async () => {
      const response = await api.admin.getSettlementDetails(settlementId);
      return response.data;
    },
  });
};

export const createSettlementMutation = () => {
  return {
    mutationFn: async (
      data: Parameters<typeof api.admin.createSettlement>[0],
    ) => {
      const response = await api.admin.createSettlement(data);
      return response.data;
    },
  };
};

export const previewSettlementMutation = () => {
  return {
    mutationFn: async (
      data: Parameters<typeof api.admin.previewSettlement>[0],
    ) => {
      const response = await api.admin.previewSettlement(data);
      return response.data;
    },
  };
};

export const adminSettlementBreakdownQueryOptions = (settlementId: string) => {
  return queryOptions({
    queryKey: ['admin', 'settlements', settlementId, 'breakdown'] as const,
    queryFn: async () => {
      const response = await api.admin.getSettlementBreakdown(settlementId);
      return response.data;
    },
  });
};

export const completeSettlementMutation = () => {
  return {
    mutationFn: async ({settlementId}: {settlementId: string}) => {
      const response = await api.admin.completeSettlement(settlementId);
      return response.data;
    },
  };
};

export const failSettlementMutation = () => {
  return {
    mutationFn: async ({
      settlementId,
      reason,
    }: {
      settlementId: string;
      reason?: string;
    }) => {
      const response = await api.admin.failSettlement(settlementId, {reason});
      return response.data;
    },
  };
};

// Create Event

export const createEventMutation = () => {
  return {
    mutationFn: async (data: {
      name: string;
      description?: string | null;
      externalId: string;
      platform: string;
      eventStartDate: string;
      eventEndDate: string;
      venueId?: string;
      venueName?: string;
      venueAddress?: string;
      venueCity?: string;
      externalUrl?: string;
      qrAvailabilityTiming?: '3h' | '6h' | '12h' | '24h' | '48h' | '72h' | null;
      status: 'active' | 'inactive';
      ticketWaves?: Array<{
        name: string;
        description?: string | null;
        faceValue: number;
        currency: 'UYU' | 'USD';
      }>;
    }) => {
      const response = await api.admin.createEvent(data);
      return response.data;
    },
  };
};

// ============================================================================
// Admin dashboard (multi-endpoint stats)
// ============================================================================

export type AdminDashboardApiQuery = {
  period?: 'today' | '7d' | '30d' | 'all';
  from?: string;
  to?: string;
};

const DASHBOARD_POLL_FAST_MS = 15_000;
const DASHBOARD_POLL_MID_MS = 30_000;
const DASHBOARD_POLL_SLOW_MS = 60_000;

export const adminDashboardTicketsQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'tickets', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardTickets(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_FAST_MS,
  });
};

export const adminDashboardRevenueQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'revenue', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardRevenue(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_FAST_MS,
  });
};

export const adminDashboardOrdersQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'orders', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardOrders(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_FAST_MS,
  });
};

export const adminDashboardPayoutsQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'payouts', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardPayouts(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_MID_MS,
  });
};

export const adminDashboardHealthQueryOptions = () => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'health'] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardHealth();
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_SLOW_MS,
  });
};

export const adminDashboardTopEventsQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'topEvents', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardTopEvents(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_MID_MS,
  });
};

export const adminDashboardRevenueTimeSeriesQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'revenueTimeSeries', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardRevenueTimeSeries(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_FAST_MS,
  });
};

export const adminDashboardOrdersTimeSeriesQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'ordersTimeSeries', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardOrdersTimeSeries(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_MID_MS,
  });
};

export const adminDashboardTicketsTimeSeriesQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'ticketsTimeSeries', params] as const,
    queryFn: async () => {
      const response = await api.admin.getDashboardTicketsTimeSeries(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_MID_MS,
  });
};

export const adminDashboardRevenueByOrderCurrencyQueryOptions = (
  params: AdminDashboardApiQuery,
) => {
  return queryOptions({
    queryKey: [
      'admin',
      'dashboard',
      'revenueByOrderCurrency',
      params,
    ] as const,
    queryFn: async () => {
      const response =
        await api.admin.getDashboardRevenueByOrderCurrency(params);
      return response.data;
    },
    refetchInterval: DASHBOARD_POLL_FAST_MS,
  });
};

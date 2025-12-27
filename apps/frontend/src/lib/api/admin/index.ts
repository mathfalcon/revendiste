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

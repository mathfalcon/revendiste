import {queryOptions} from '@tanstack/react-query';
import {toast} from 'sonner';
import {api} from '../';
import type {
  CreateTicketReportBody,
  AddUserActionBody,
  AddAdminActionBody,
} from '../generated';
import type {
  TicketReportStatus,
  TicketReportCaseType,
} from '@revendiste/shared';

export interface AdminTicketReportsQueryParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: TicketReportStatus;
  caseType?: TicketReportCaseType;
}

// ── User queries ──────────────────────────────────────────────────────────────

export const getMyTicketReportsQuery = () =>
  queryOptions({
    queryKey: ['ticket-reports', 'my-reports'],
    queryFn: async () => {
      const response = await api.ticketReports.listMyCases();
      return response.data;
    },
  });

export const getTicketReportDetailQuery = (reportId: string) =>
  queryOptions({
    queryKey: ['ticket-reports', reportId],
    queryFn: async () => {
      const response = await api.ticketReports.getCaseDetails(reportId);
      return response.data;
    },
    enabled: !!reportId,
  });

// ── Admin queries ─────────────────────────────────────────────────────────────

export const adminTicketReportsQueryOptions = (
  params: AdminTicketReportsQueryParams,
) =>
  queryOptions({
    queryKey: ['admin', 'ticket-reports', params],
    queryFn: async () => {
      const response = await api.admin.listCases({
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        status: params.status,
        caseType: params.caseType,
      });
      return response.data;
    },
  });

export const adminTicketReportDetailQueryOptions = (reportId: string) =>
  queryOptions({
    queryKey: ['admin', 'ticket-reports', reportId],
    queryFn: async () => {
      const response = await api.admin.getCaseDetails(reportId);
      return response.data;
    },
    enabled: !!reportId,
  });

// ── User mutations ────────────────────────────────────────────────────────────

export const createCaseMutation = () => ({
  mutationFn: async (data: CreateTicketReportBody) => {
    const response = await api.ticketReports.createCase(data);
    return response.data;
  },
  // No toast here - let calling component handle success message
});

export const addUserActionMutation = (reportId: string) => ({
  mutationFn: async (data: AddUserActionBody) => {
    const response = await api.ticketReports.addAction(reportId, data);
    return response.data;
  },
  onSuccess: () => {
    toast.success('Acción agregada');
  },
});

export const closeCaseMutation = (reportId: string) => ({
  mutationFn: async () => {
    const response = await api.ticketReports.closeCase(reportId);
    return response.data;
  },
  onSuccess: () => {
    toast.success('Caso cerrado');
  },
});

// ── Attachment queries ────────────────────────────────────────────────────────

export const getReportAttachmentsQuery = (reportId: string) =>
  queryOptions({
    queryKey: ['ticket-reports', reportId, 'attachments'],
    queryFn: async () => {
      const response = await api.ticketReports.listAttachments(reportId);
      return response.data;
    },
    enabled: !!reportId,
  });

export const adminReportAttachmentsQuery = (reportId: string) =>
  queryOptions({
    queryKey: ['admin', 'ticket-reports', reportId, 'attachments'],
    queryFn: async () => {
      const response = await api.admin.listAttachments(reportId);
      return response.data;
    },
    enabled: !!reportId,
  });

// ── Attachment mutations ─────────────────────────────────────────────────────

export const uploadReportAttachmentMutation = (
  reportId: string,
  actionId?: string,
) => ({
  mutationFn: async (file: File) => {
    const response = await api.ticketReports.uploadAttachment(
      reportId,
      {file},
      actionId ? {actionId} : undefined,
    );
    return response.data;
  },
});

export const uploadAdminReportAttachmentMutation = (
  reportId: string,
  actionId?: string,
) => ({
  mutationFn: async (file: File) => {
    const response = await api.admin.uploadAttachment(
      reportId,
      {file},
      actionId ? {actionId} : undefined,
    );
    return response.data;
  },
});

// ── Admin mutations ───────────────────────────────────────────────────────────

export const addAdminActionMutation = (reportId: string) => ({
  mutationFn: async (data: AddAdminActionBody) => {
    const response = await api.admin.addAction(reportId, data);
    return response.data;
  },
  onSuccess: () => {
    toast.success('Acción aplicada');
  },
});

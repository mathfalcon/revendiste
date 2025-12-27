import {mutationOptions, queryOptions} from '@tanstack/react-query';
import {api, CreateTicketListingRouteBody, UpdateTicketPriceRouteBody} from '..';
import {toast} from 'sonner';

export const postTicketListingMutation = () =>
  mutationOptions({
    mutationKey: ['create-ticket-listing'],
    mutationFn: (data: CreateTicketListingRouteBody) =>
      api.ticketListings.create(data).then(data => data.data),
    onSuccess(data) {
      // TODO: redirect to listings page
      toast.success('Entradas publicadas con éxito');
    },
  });

export const getMyListingsQuery = () =>
  queryOptions({
    queryKey: ['listings'],
    queryFn: () => api.ticketListings.getMyListings().then(data => data.data),
  });

export const uploadTicketDocumentMutation = (ticketId: string) =>
  mutationOptions({
    mutationKey: ['upload-ticket-document', ticketId],
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.ticketListings
        .uploadDocument(
          ticketId,
          {file},
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        )
        .then(res => res.data);
    },
    onSuccess: () => {
      toast.success('Documento subido exitosamente');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Error al subir el documento. Por favor intenta nuevamente.',
      );
    },
  });

export const updateTicketDocumentMutation = (ticketId: string) =>
  mutationOptions({
    mutationKey: ['update-ticket-document', ticketId],
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.ticketListings
        .updateDocument(
          ticketId,
          {file},
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        )
        .then(res => res.data);
    },
    onSuccess: () => {
      toast.success('Documento actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Error al actualizar el documento. Por favor intenta nuevamente.',
      );
    },
  });

export const updateTicketPriceMutation = (ticketId: string) =>
  mutationOptions({
    mutationKey: ['update-ticket-price', ticketId],
    mutationFn: (data: UpdateTicketPriceRouteBody) =>
      api.ticketListings
        .updateTicketPrice(ticketId, data)
        .then(res => res.data),
    onSuccess: () => {
      toast.success('Precio actualizado exitosamente');
    },
  });

export const deleteTicketMutation = (ticketId: string) =>
  mutationOptions({
    mutationKey: ['delete-ticket', ticketId],
    mutationFn: () =>
      api.ticketListings.removeTicket(ticketId).then(res => res.data),
    onSuccess: () => {
      toast.success('Ticket retirado exitosamente');
    },
  });

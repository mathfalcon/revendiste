import {
  OrdersRepository,
  OrderItemsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrderTicketReservationsRepository,
} from '~/repositories';
import {logger} from '~/utils';
import {NotFoundError, ValidationError, UnauthorizedError} from '~/errors';
import {CreateOrderRouteBody} from '~/controllers/orders/validation';
import {
  ORDER_ERROR_MESSAGES,
  EVENT_ERROR_MESSAGES,
} from '~/constants/error-messages';
import {MAX_TICKETS_PER_ORDER} from '~/constants/orders';
import {RESERVATION_WINDOW_MINUTES} from '~/constants/reservation';
import {calculateOrderFees} from '~/utils/fees';
import {getStorageProvider} from '~/services/storage';
import type {PaymentSyncService} from '~/services/payments/sync';
import type {PaginationOptions} from '~/types/pagination';
import {createPaginatedResponse} from '~/middleware/pagination';

export class OrdersService {
  private readonly storageProvider = getStorageProvider();

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly orderItemsRepository: OrderItemsRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly eventTicketWavesRepository: EventTicketWavesRepository,
    private readonly listingTicketsRepository: ListingTicketsRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly paymentSyncService: PaymentSyncService,
  ) {}

  /**
   * Syncs payment status with the provider if the order is pending.
   * This is called when fetching an order to ensure the user sees the latest status
   * (e.g., after returning from payment provider redirect).
   *
   * This is the "sync on return" pattern - industry standard for handling
   * webhook delays from payment providers.
   */
  private async syncPaymentStatusIfPending(orderId: string): Promise<void> {
    // Get the order first to check status
    const order = await this.ordersRepository.getByIdWithItems(orderId);

    // Only sync if order exists and is pending
    if (!order || order.status !== 'pending') {
      return;
    }

    // Use the injected sync service
    await this.paymentSyncService.syncPendingOrderPayment(orderId);
  }

  async createOrder(data: CreateOrderRouteBody, userId: string) {
    // Check if user already has a pending order for this event
    const existingOrder =
      await this.ordersRepository.getPendingOrderByUserAndEvent(
        userId,
        data.eventId,
      );
    if (existingOrder) {
      throw new ValidationError(
        ORDER_ERROR_MESSAGES.PENDING_ORDER_EXISTS(existingOrder.id),
        {orderId: existingOrder.id},
      );
    }

    // Validate that the event exists and hasn't finished
    const event = await this.eventsRepository.getById(data.eventId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    if (new Date() > event.eventEndDate) {
      throw new ValidationError(ORDER_ERROR_MESSAGES.EVENT_FINISHED);
    }

    // Calculate total quantities and validate ticket availability
    let totalTickets = 0;
    let subtotalAmount = 0;
    const orderItems: Array<{
      ticketWaveId: string;
      pricePerTicket: number;
      quantity: number;
      subtotal: number;
    }> = [];
    const ticketsToReserve: Array<{
      ticketWaveId: string;
      price: number;
      quantity: number;
      ticketIds: string[];
    }> = [];
    const ticketWaveCurrencies: Set<string> = new Set();

    // Process each ticket wave selection
    for (const [ticketWaveId, priceGroups] of Object.entries(
      data.ticketSelections,
    )) {
      // Validate ticket wave exists and belongs to event
      const ticketWave = await this.eventTicketWavesRepository.getById(
        ticketWaveId,
      );
      if (!ticketWave) {
        throw new NotFoundError(
          ORDER_ERROR_MESSAGES.TICKET_WAVE_NOT_FOUND(ticketWaveId),
        );
      }

      if (ticketWave.eventId !== data.eventId) {
        throw new ValidationError(
          ORDER_ERROR_MESSAGES.TICKET_WAVE_INVALID_EVENT(ticketWaveId),
        );
      }

      // Track currency for validation
      ticketWaveCurrencies.add(ticketWave.currency);

      // Process each price group within the ticket wave
      for (const [priceStr, quantity] of Object.entries(priceGroups)) {
        if (quantity <= 0) continue; // Skip zero quantities

        const price = parseFloat(priceStr);
        totalTickets += quantity;
        subtotalAmount += price * quantity;

        // Find available tickets for this price group
        const availableTickets =
          await this.listingTicketsRepository.findAvailableTicketsByPriceGroup(
            ticketWaveId,
            price,
            quantity,
          );

        if (availableTickets.length < quantity) {
          throw new ValidationError(
            ORDER_ERROR_MESSAGES.INSUFFICIENT_TICKETS(
              availableTickets.length,
              price,
              ticketWave.name,
              quantity,
              ticketWave.currency,
            ),
          );
        }

        // Check that user is not trying to buy their own tickets
        // We need to check the listing's userId, not the ticket's userId
        const listingIds = [
          ...new Set(availableTickets.map(ticket => ticket.listingId)),
        ];
        const listings = await this.listingTicketsRepository.getListingsByIds(
          listingIds,
        );
        const userOwnedListings = listings.filter(
          listing => listing.publisherUserId === userId,
        );

        if (userOwnedListings.length > 0) {
          throw new ValidationError(
            ORDER_ERROR_MESSAGES.CANNOT_BUY_OWN_TICKETS,
          );
        }

        // Store order item data
        orderItems.push({
          ticketWaveId,
          pricePerTicket: price,
          quantity,
          subtotal: price * quantity,
        });

        // Store ticket reservation data
        ticketsToReserve.push({
          ticketWaveId,
          price,
          quantity,
          ticketIds: availableTickets
            .map(ticket => ticket.id)
            .filter((id): id is string => id !== null),
        });
      }
    }

    // Validate that all ticket waves have the same currency
    if (ticketWaveCurrencies.size > 1) {
      const currencies = Array.from(ticketWaveCurrencies).join(', ');
      throw new ValidationError(
        ORDER_ERROR_MESSAGES.MIXED_CURRENCIES(currencies),
      );
    }

    // Validate total ticket limit
    if (totalTickets > MAX_TICKETS_PER_ORDER) {
      throw new ValidationError(ORDER_ERROR_MESSAGES.TOO_MANY_TICKETS);
    }

    if (totalTickets === 0) {
      throw new ValidationError(ORDER_ERROR_MESSAGES.NO_TICKETS_SELECTED);
    }

    // Calculate fees using centralized utility
    const feeCalculation = calculateOrderFees(subtotalAmount);

    // Get currency from first ticket wave (all currencies are the same after validation)
    const firstTicketWave = await this.eventTicketWavesRepository.getById(
      Object.keys(data.ticketSelections)[0],
    );
    const currency = firstTicketWave?.currency || 'UYU';

    // Create order and reserve tickets in a single transaction
    return await this.ordersRepository.executeTransaction(async trx => {
      // Create transaction-aware repository instances
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const orderItemsRepo = this.orderItemsRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);

      // Create order
      const order = await ordersRepo.create({
        userId,
        eventId: data.eventId,
        status: 'pending',
        totalAmount: feeCalculation.totalAmount,
        subtotalAmount: feeCalculation.subtotalAmount,
        platformCommission: feeCalculation.platformCommission,
        vatOnCommission: feeCalculation.vatOnCommission,
        currency,
        reservationExpiresAt: new Date(
        Date.now() + RESERVATION_WINDOW_MINUTES * 60 * 1000,
      ),
      });

      // Create order items
      await orderItemsRepo.createBatch(
        orderItems.map(item => ({
          ...item,
          orderId: order.id,
        })),
      );

      // Clean up expired reservations for the tickets we're trying to reserve
      // This ensures expired reservations don't block new ones (soft-deleted for history)
      // This is a safety net - we also have a scheduled job, but this ensures immediate cleanup
      const allTicketIds = ticketsToReserve.flatMap(r => r.ticketIds);
      await reservationsRepo.cleanupExpiredReservationsForTickets(allTicketIds);

      // Create ticket reservations with error handling for race conditions
      const reservedUntil = new Date(
        Date.now() + RESERVATION_WINDOW_MINUTES * 60 * 1000,
      );

      try {
        await reservationsRepo.createReservations(
          order.id,
          allTicketIds,
          reservedUntil,
        );
      } catch (error: any) {
        // Handle unique constraint violation (race condition with another user)
        if (
          error.code === '23505' &&
          error.constraint ===
            'order_ticket_reservations_unique_active_reservation'
        ) {
          // This means another user just reserved these tickets
          // Expired reservations have been cleaned up, so this is a real conflict
          throw new ValidationError(
            ORDER_ERROR_MESSAGES.TICKETS_NO_LONGER_AVAILABLE,
          );
        }
        throw error; // Re-throw other errors
      }

      logger.info(
        `Created order ${order.id} for user ${userId} with ${totalTickets} tickets`,
      );

      return order;
    });
  }

  async getOrderById(orderId: string, userId: string) {
    // Sync payment status with provider if order is pending
    // This ensures user sees latest status after returning from payment provider
    await this.syncPaymentStatusIfPending(orderId);

    // Fetch fresh order data after potential sync
    const order = await this.ordersRepository.getByIdWithItems(orderId);

    if (!order) {
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    // Ensure user can only access their own orders
    if (order.userId !== userId) {
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  async getUserOrders(userId: string, pagination: PaginationOptions) {
    const [orders, total] = await Promise.all([
      this.ordersRepository.getByUserId(userId, pagination),
      this.ordersRepository.getByUserIdCount(userId),
    ]);
    return createPaginatedResponse(orders, total, pagination);
  }

  async cancelOrder(orderId: string, userId: string) {
    // Verify order exists and belongs to user
    const order = await this.ordersRepository.getByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    if (order.userId !== userId) {
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      throw new ValidationError(ORDER_ERROR_MESSAGES.ORDER_NOT_CANCELLABLE);
    }

    // Cancel the order and release reservations in a transaction
    return await this.ordersRepository.executeTransaction(async trx => {
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);

      // Release reservations to free up tickets
      await reservationsRepo.releaseByOrderId(orderId);

      // Update order status to cancelled
      const cancelledOrder = await ordersRepo.updateStatus(
        orderId,
        'cancelled',
        {
          cancelledAt: new Date(),
        },
      );

      logger.info(`Order ${orderId} cancelled by user ${userId}`);

      return {
        id: cancelledOrder.id,
        status: cancelledOrder.status,
        cancelledAt: cancelledOrder.cancelledAt,
      };
    });
  }

  async getOrderTickets(orderId: string, userId: string) {
    // Verify order exists and belongs to user
    const order = await this.ordersRepository.getByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    if (order.userId !== userId) {
      throw new UnauthorizedError(
        ORDER_ERROR_MESSAGES.UNAUTHORIZED_TICKET_ACCESS,
      );
    }

    // Get tickets for this order
    const tickets =
      await this.orderTicketReservationsRepository.getTicketsByOrderId(orderId);

    // Enrich with document URLs if available
    const enrichedTickets = await Promise.all(
      tickets.map(async ticket => ({
        id: ticket.id,
        price: ticket.price,
        soldAt: ticket.soldAt,
        hasDocument: !!ticket.document,
        reservationStatus: ticket.reservationStatus,
        ticketWave: ticket.ticketWaveName
          ? {
              name: ticket.ticketWaveName,
            }
          : null,
        document:
          ticket.document && ticket.document.storagePath
            ? {
                id: ticket.document.id,
                status: ticket.document.status,
                uploadedAt: ticket.document.uploadedAt,
                mimeType: ticket.document.mimeType,
                url: await this.storageProvider.getUrl(
                  ticket.document.storagePath,
                ),
              }
            : null,
      })),
    );

    return {
      orderId: order.id,
      event: order.event
        ? {
            name: order.event.name || null,
            eventStartDate: order.event.eventStartDate || null,
          }
        : null,
      subtotalAmount: order.subtotalAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      platformCommission: order.platformCommission.toString(),
      vatOnCommission: order.vatOnCommission.toString(),
      currency: order.currency,
      tickets: enrichedTickets,
    };
  }
}

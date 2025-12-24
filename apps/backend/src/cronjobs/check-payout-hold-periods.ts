import {SellerEarningsService} from '~/services/seller-earnings';
import {
  SellerEarningsRepository,
  OrderTicketReservationsRepository,
  ListingTicketsRepository,
} from '~/repositories';
import {db} from '~/db';
import {logger} from '~/utils';

(async () => {
  try {
    logger.info('Checking payout hold periods...');
    const sellerEarningsRepository = new SellerEarningsRepository(db);
    const orderTicketReservationsRepository =
      new OrderTicketReservationsRepository(db);
    const listingTicketsRepository = new ListingTicketsRepository(db);

    const sellerEarningsService = new SellerEarningsService(
      sellerEarningsRepository,
      orderTicketReservationsRepository,
      listingTicketsRepository,
    );

    const result = await sellerEarningsService.checkHoldPeriods();
    logger.info('Payout hold periods checked', {
      released: result.released,
      retained: result.retained,
    });
  } catch (error) {
    logger.error('Error checking payout hold periods:', error);
    process.exit(1);
  }
})();


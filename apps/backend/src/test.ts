import {db} from './db';
import {NotificationService} from './services/notifications';
import {UsersRepository} from './repositories';

(async () => {
  const notificationService = new NotificationService(
    db,
    new UsersRepository(db),
  );
  const notification = await notificationService.sendNotification(
    'eb334c98-f2e4-44ac-a0e5-1843c272f502',
  );
})();

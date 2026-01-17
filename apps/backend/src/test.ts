import {runNotifyUploadAvailability} from './cronjobs/notify-upload-availability';

(async () => {
  await runNotifyUploadAvailability();
})();

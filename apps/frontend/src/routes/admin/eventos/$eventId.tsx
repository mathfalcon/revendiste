import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {adminEventDetailsQueryOptions} from '~/lib/api/admin';
import {EventDetailPage} from '~/features/admin/events/EventDetailPage';

export const Route = createFileRoute('/admin/eventos/$eventId')({
  component: EventDetailRoute,
  loader: ({context, params}) => {
    return context.queryClient.ensureQueryData(
      adminEventDetailsQueryOptions(params.eventId),
    );
  },
});

function EventDetailRoute() {
  const navigate = useNavigate();
  const {eventId} = Route.useParams();

  const handleBack = () => {
    navigate({to: '/admin/eventos'});
  };

  return <EventDetailPage eventId={eventId} onBack={handleBack} />;
}

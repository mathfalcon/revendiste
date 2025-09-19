import {GetEventByIdResponse} from '~/lib';
import {Button} from '~/components/ui/button';
import {getCurrencySymbol} from '~/utils';
import {MinusIcon, PlusIcon} from 'lucide-react';
import {Input} from '~/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';

type EventRightSideProps = Pick<GetEventByIdResponse, 'ticketWaves'>;

export const EventRightSide = (props: EventRightSideProps) => {
  const {ticketWaves} = props;

  const availableTicketWaves = ticketWaves;
  // .filter(
  //   ticketWave => ticketWave.waveListings.length > 0,
  // );

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4'>
        <h3 className='font-medium text-lg'>Entradas disponibles</h3>
        <Accordion
          type='single'
          className='bg-background w-full px-6 py-1.5 rounded-md flex flex-col'
          defaultValue='ticket-wave-1'
        >
          {availableTicketWaves.map((ticketWave, index) => (
            <TicketWaveForm
              key={ticketWave.name}
              ticketWave={ticketWave}
              index={index}
            />
          ))}
        </Accordion>
      </div>

      {/* <div className='bg-red-300 w-full p-6 rounded-md'>summary</div> */}

      <div className='flex justify-end'>
        <Button className='bg-primary-gradient h-[3rem] w-[10rem]'>
          Comprar
        </Button>
      </div>
    </div>
  );
};

// const TicketWaveForm = (props: {
//   ticketWave: GetEventByIdResponse['ticketWaves'][number];
// }) => {
//   return (
//     <div className='w-full h-[52px] py-6 flex items-center last:border-b-0 border-b border-foreground/30 justify-between box-content'>
//       <div className='flex flex-col gap-2'>
//         <div className='flex gap-4 font-medium'>
//           <span>{props.ticketWave.name}</span>
//           <span className='text-primary-700'>
//             {getCurrencySymbol(props.ticketWave.currency)}
//             {props.ticketWave.faceValue}
//           </span>
//         </div>
//         <p className='text-sm'>{props.ticketWave.description}</p>
//       </div>
//       <div className='flex items-center gap-3'>
//         <Button variant='ghost' size='icon' className='bg-[#7E7E7E]'>
//           <MinusIcon className='text-white' />
//         </Button>
//         <Input
//           readOnly
//           className='border-primary w-[4rem] text-center'
//           type='number'
//         />
//         <Button variant='ghost' size='icon' className='bg-primary-gradient'>
//           <PlusIcon className='text-white' />
//         </Button>
//       </div>
//     </div>
//   );
// };

const TicketWaveForm = (props: {
  ticketWave: GetEventByIdResponse['ticketWaves'][number];
  index: number;
}) => {
  const {ticketWave, index} = props;
  console.log(ticketWave);
  return (
    <AccordionItem value={`ticket-wave-${index + 1}`}>
      <AccordionTrigger>
        <div className='flex flex-col gap-2'>
          <h3 className='font-medium'>{ticketWave.name}</h3>
          <p className='font-sm text-foreground/25'>{ticketWave.description}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent>asd</AccordionContent>
    </AccordionItem>
  );
};

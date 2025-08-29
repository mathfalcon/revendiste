import * as React from 'react';

export const Calendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={20}
    height={20}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g opacity={0.7} stroke='#000' strokeLinecap='round' strokeLinejoin='round'>
      <path
        d='M6.442 1.61v2.415m6.444-2.415v2.415M2.818 7.318H16.51m.402-.475v6.843c0 2.415-1.208 4.025-4.027 4.025H6.443c-2.819 0-4.027-1.61-4.027-4.025V6.843c0-2.415 1.208-4.025 4.027-4.025h6.442c2.819 0 4.027 1.61 4.027 4.025'
        strokeMiterlimit={10}
        stroke='currentColor'
      />
      <path
        d='M12.64 11.03h.007m-.007 2.415h.007M9.66 11.03h.007m-.007 2.415h.007M6.68 11.03h.007m-.007 2.415h.007'
        stroke='currentColor'
      />
    </g>
  </svg>
);

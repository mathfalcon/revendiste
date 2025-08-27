import * as React from 'react';

export const MapPinFilled = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={20}
    height={21}
    viewBox='0 0 20 21'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      opacity={0.4}
      d='M17.183 7.048C16.308 3.194 12.95 1.459 10 1.459h-.01c-2.941 0-6.308 1.727-7.183 5.58-.975 4.304 1.658 7.949 4.042 10.243A4.53 4.53 0 0 0 10 18.558a4.5 4.5 0 0 0 3.141-1.276c2.384-2.294 5.017-5.93 4.042-10.234'
      className='fill-primary dark:fill-primary-400'
    />
    <path
      d='M10 11.226A2.626 2.626 0 0 0 12.625 8.6 2.626 2.626 0 1 0 10 11.226'
      className='fill-primary dark:fill-primary-400'
    />
  </svg>
);

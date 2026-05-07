import {Img, staticFile} from 'remotion';

export function BrandLogo({width = 400}: {width?: number}) {
  return (
    <Img
      src={staticFile('logos/logo-isotype.svg')}
      style={{width, height: 'auto'}}
    />
  );
}

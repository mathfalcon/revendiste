import {parseItauUsdVentaFromXml} from '../itauCotizXml';

describe('parseItauUsdVentaFromXml', () => {
  it('reads venta for moneda LINK', () => {
    const xml = `<?xml version="1.0"?>
<root>
  <cotizacion>
    <moneda>ARS</moneda>
    <compra>0,12</compra>
    <venta>0,15</venta>
  </cotizacion>
  <cotizacion>
    <moneda>LINK</moneda>
    <compra>39,85</compra>
    <venta>40,15</venta>
  </cotizacion>
</root>`;
    expect(parseItauUsdVentaFromXml(xml)).toBeCloseTo(40.15, 4);
  });

  it('accepts DOL code (comma decimal)', () => {
    const xml = `<lista><cotizacion>
    <moneda>DOL</moneda>
    <compra>39,85</compra>
    <venta>40,20</venta>
  </cotizacion></lista>`;
    expect(parseItauUsdVentaFromXml(xml)).toBeCloseTo(40.2, 4);
  });

  it('throws when USD venta missing', () => {
    expect(() =>
      parseItauUsdVentaFromXml('<root><cotizacion><moneda>EUR</moneda></cotizacion></root>'),
    ).toThrow();
  });
});

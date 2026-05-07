import axios from 'axios';
import {DLocalService} from '~/services/dlocal';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
    })),
    get: jest.fn(),
  },
}));

jest.mock('~/config/env', () => ({
  DLOCAL_API_KEY: 'k',
  DLOCAL_SECRET_KEY: 's',
  DLOCAL_BASE_URL: 'https://api.test',
}));

describe('DLocalService.forceExpirationCheck', () => {
  const axiosGet = axios.get as jest.Mock;

  beforeEach(() => {
    axiosGet.mockReset();
    axiosGet.mockResolvedValue({status: 200});
  });

  it('does nothing when status is not PENDING', async () => {
    const svc = new DLocalService();
    await svc.forceExpirationCheck({
      id: 'DP-1',
      status: 'PAID',
      amount: 100,
      currency: 'UYU',
      redirect_url: 'https://checkout.example/pay',
    });
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it('does nothing when redirect_url is missing', async () => {
    const svc = new DLocalService();
    await svc.forceExpirationCheck({
      id: 'DP-1',
      status: 'PENDING',
      amount: 100,
      currency: 'UYU',
    });
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it('GETs redirect_url when PENDING', async () => {
    const svc = new DLocalService();
    const url = 'https://checkout.dlocalgo.com/validate/token';
    await svc.forceExpirationCheck({
      id: 'DP-2',
      status: 'PENDING',
      amount: 100,
      currency: 'UYU',
      redirect_url: url,
    });
    expect(axiosGet).toHaveBeenCalledWith(url, {
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: expect.any(Function),
    });
  });

  it('swallows axios errors', async () => {
    axiosGet.mockRejectedValueOnce(new Error('network'));
    const svc = new DLocalService();
    await expect(
      svc.forceExpirationCheck({
        id: 'DP-3',
        status: 'PENDING',
        amount: 100,
        currency: 'UYU',
        redirect_url: 'https://checkout.example/pay',
      }),
    ).resolves.toBeUndefined();
  });
});

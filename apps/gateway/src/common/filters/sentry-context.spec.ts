import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    delete process.env.SENTRY_DSN;
    filter = new AllExceptionsFilter();
  });

  it('should process an HTTP 403 Forbidden exception without throwing when SENTRY_DSN is not set', () => {

    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = jest.fn().mockReturnValue({
      method: 'GET',
      url: '/test',
      headers: {},
    });
    const mockSwitchToHttp = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    const mockHost = {
      switchToHttp: mockSwitchToHttp,
    } as any;

    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    expect(() => filter.catch(exception, mockHost)).not.toThrow();

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      }),
    );
  });
});

/**
 * Tests for Orange Money integration
 */

const axios = require('axios');
const {
  initPaymentSession,
  verifyPaymentStatus,
  handlePaymentCallback,
  refundPayment,
  getTransactionHistory,
} = require('../src/integrations/orangeMoney');

jest.mock('axios');

// Mock environment variables
process.env.MOCK_PAYMENT_MODE = 'false';
process.env.ORANGE_MONEY_API_BASE = 'https://api.test.orange.com/orange-money-webpay/cm/v1';
process.env.ORANGE_MONEY_API_KEY = 'test-key-123';
process.env.ORANGE_MONEY_MERCHANT_ID = 'TEST-MERCHANT';

describe('Orange Money Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initPaymentSession', () => {
    test('initializes payment session in mock mode', async () => {
      process.env.MOCK_PAYMENT_MODE = 'true';

      const result = await initPaymentSession(150000, 'ORDER-001', {
        email: 'test@akig.com',
        phone: '+237612345678',
      });

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('redirectUrl');
      expect(result.amount).toBe(150000);
      expect(result.reference).toBe('ORDER-001');
      expect(result.status).toBe('initiated');
      expect(result.sessionId).toContain('MOCK-');

      process.env.MOCK_PAYMENT_MODE = 'false';
    });

    test('initializes payment session in production mode', async () => {
      axios.post.mockResolvedValue({
        data: {
          session_id: 'SESSION-ABC123',
          status: 'initiated',
          payment_url: 'https://pay.orange.com/session/SESSION-ABC123',
          expires_in: 600,
        },
      });

      const result = await initPaymentSession(150000, 'ORDER-001', {
        email: 'test@akig.com',
        description: 'Invoice payment',
      });

      expect(result.sessionId).toBe('SESSION-ABC123');
      expect(result.amount).toBe(150000);
      expect(result.redirectUrl).toContain('SESSION-ABC123');
      expect(result.expiresIn).toBe(600);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/pay'),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'X-Signature': expect.any(String),
          }),
        })
      );
    });

    test('handles API errors gracefully', async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid API key' },
        },
        message: 'Unauthorized',
      });

      await expect(initPaymentSession(150000, 'ORDER-001')).rejects.toMatchObject({
        code: 'ORANGE_MONEY_ERROR',
        message: 'Failed to initialize payment session',
      });
    });

    test('generates signature for production requests', async () => {
      axios.post.mockResolvedValue({
        data: {
          session_id: 'SESSION-123',
          status: 'initiated',
          payment_url: 'https://pay.orange.com/session/SESSION-123',
        },
      });

      await initPaymentSession(100000, 'REF-001');

      expect(axios.post).toHaveBeenCalled();
      const callArgs = axios.post.mock.calls[0];
      const headers = callArgs[2].headers;

      expect(headers['X-Signature']).toBeDefined();
      expect(headers['X-Signature']).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
    });
  });

  describe('verifyPaymentStatus', () => {
    test('verifies payment status in mock mode', async () => {
      process.env.MOCK_PAYMENT_MODE = 'true';

      const result = await verifyPaymentStatus('MOCK-SESSION-001');

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('transactionId');
      expect(result.status).toBe('paid');
      expect(result.paymentMethod).toBe('ORANGE_MONEY_MOCK');

      process.env.MOCK_PAYMENT_MODE = 'false';
    });

    test('verifies payment status in production mode', async () => {
      axios.get.mockResolvedValue({
        data: {
          session_id: 'SESSION-123',
          status: 'paid',
          amount: 150000,
          order_id: 'ORDER-001',
          transaction_id: 'TXN-789',
          paid_at: '2025-10-24T10:00:00Z',
          payment_method: 'ORANGE_MONEY',
        },
      });

      const result = await verifyPaymentStatus('SESSION-123');

      expect(result.sessionId).toBe('SESSION-123');
      expect(result.status).toBe('paid');
      expect(result.transactionId).toBe('TXN-789');
      expect(result.amount).toBe(150000);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/pay/SESSION-123/status'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    test('handles pending payment status', async () => {
      axios.get.mockResolvedValue({
        data: {
          session_id: 'SESSION-456',
          status: 'pending',
          amount: 200000,
          order_id: 'ORDER-002',
        },
      });

      const result = await verifyPaymentStatus('SESSION-456');

      expect(result.status).toBe('pending');
    });

    test('handles failed payment status', async () => {
      axios.get.mockResolvedValue({
        data: {
          session_id: 'SESSION-789',
          status: 'failed',
          amount: 100000,
        },
      });

      const result = await verifyPaymentStatus('SESSION-789');

      expect(result.status).toBe('failed');
    });

    test('handles API errors during verification', async () => {
      axios.get.mockRejectedValue({
        response: { status: 404, data: { error: 'Session not found' } },
        message: 'Not found',
      });

      await expect(verifyPaymentStatus('INVALID-SESSION')).rejects.toMatchObject({
        code: 'ORANGE_MONEY_ERROR',
      });
    });
  });

  describe('handlePaymentCallback', () => {
    test('handles valid payment callback in mock mode', async () => {
      process.env.MOCK_PAYMENT_MODE = 'true';

      const callbackData = {
        session_id: 'MOCK-SESSION-001',
        status: 'paid',
        transaction_id: 'TXN-001',
        amount: 150000,
        order_id: 'ORDER-001',
      };

      const result = await handlePaymentCallback(callbackData, null);

      expect(result.sessionId).toBe('MOCK-SESSION-001');
      expect(result.status).toBe('paid');
      expect(result.transactionId).toBe('TXN-001');
      expect(result.paymentMethod).toBe('ORANGE_MONEY');

      process.env.MOCK_PAYMENT_MODE = 'false';
    });

    test('verifies callback signature in production mode', async () => {
      const crypto = require('crypto');

      const callbackData = {
        session_id: 'SESSION-123',
        status: 'paid',
        transaction_id: 'TXN-789',
        amount: 150000,
        order_id: 'ORDER-001',
        paid_at: '2025-10-24T10:00:00Z',
      };

      // Generate correct signature
      const dataToSign = `${callbackData.session_id}${callbackData.status}${callbackData.transaction_id}${process.env.ORANGE_MONEY_API_KEY}`;
      const correctSignature = crypto
        .createHmac('sha256', process.env.ORANGE_MONEY_API_KEY)
        .update(dataToSign)
        .digest('hex');

      const result = await handlePaymentCallback(callbackData, correctSignature);

      expect(result.sessionId).toBe('SESSION-123');
      expect(result.status).toBe('paid');
    });

    test('rejects callback with invalid signature', async () => {
      const callbackData = {
        session_id: 'SESSION-456',
        status: 'paid',
        transaction_id: 'TXN-999',
      };

      const invalidSignature = 'invalid-signature-123456789';

      await expect(handlePaymentCallback(callbackData, invalidSignature)).rejects.toMatchObject({
        code: 'ORANGE_MONEY_CALLBACK_ERROR',
      });
    });
  });

  describe('refundPayment', () => {
    test('processes refund in mock mode', async () => {
      process.env.MOCK_PAYMENT_MODE = 'true';

      const result = await refundPayment('TXN-001', 150000);

      expect(result).toHaveProperty('refundId');
      expect(result.transactionId).toBe('TXN-001');
      expect(result.amount).toBe(150000);
      expect(result.status).toBe('completed');
      expect(result.refundId).toContain('MOCK-');

      process.env.MOCK_PAYMENT_MODE = 'false';
    });

    test('processes refund in production mode', async () => {
      axios.post.mockResolvedValue({
        data: {
          refund_id: 'REFUND-ABC123',
          status: 'completed',
        },
      });

      const result = await refundPayment('TXN-123', 150000);

      expect(result.refundId).toBe('REFUND-ABC123');
      expect(result.status).toBe('completed');
      expect(result.transactionId).toBe('TXN-123');
      expect(result.amount).toBe(150000);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/refund'),
        expect.objectContaining({
          transaction_id: 'TXN-123',
          amount: expect.any(Number),
        }),
        expect.any(Object)
      );
    });

    test('handles partial refund', async () => {
      axios.post.mockResolvedValue({
        data: {
          refund_id: 'REFUND-PARTIAL',
          status: 'completed',
        },
      });

      const result = await refundPayment('TXN-456', 50000); // Partial refund

      expect(result.amount).toBe(50000);
    });

    test('handles refund API errors', async () => {
      axios.post.mockRejectedValue({
        response: { status: 400, data: { error: 'Transaction not found' } },
        message: 'Bad request',
      });

      await expect(refundPayment('INVALID-TXN', 100000)).rejects.toMatchObject({
        code: 'ORANGE_MONEY_ERROR',
      });
    });
  });

  describe('getTransactionHistory', () => {
    test('retrieves transaction history in mock mode', async () => {
      process.env.MOCK_PAYMENT_MODE = 'true';

      const result = await getTransactionHistory({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('transactionId');
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('status');

      process.env.MOCK_PAYMENT_MODE = 'false';
    });

    test('retrieves transaction history in production mode', async () => {
      axios.get.mockResolvedValue({
        data: {
          transactions: [
            {
              id: 'TXN-001',
              amount: 150000,
              status: 'paid',
              created_at: '2025-10-24T10:00:00Z',
            },
            {
              id: 'TXN-002',
              amount: 200000,
              status: 'paid',
              created_at: '2025-10-24T11:00:00Z',
            },
          ],
        },
      });

      const result = await getTransactionHistory({
        startDate: '2025-10-01',
        endDate: '2025-10-31',
        limit: 50,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/transactions'),
        expect.any(Object)
      );
    });

    test('filters transactions by status', async () => {
      axios.get.mockResolvedValue({
        data: {
          transactions: [
            {
              id: 'TXN-001',
              amount: 150000,
              status: 'paid',
            },
          ],
        },
      });

      const result = await getTransactionHistory({ status: 'paid' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('paid');
    });

    test('handles empty transaction history', async () => {
      axios.get.mockResolvedValue({
        data: {
          transactions: [],
        },
      });

      const result = await getTransactionHistory();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('handles API errors during history retrieval', async () => {
      axios.get.mockRejectedValue({
        response: { status: 500, data: { error: 'Server error' } },
        message: 'Internal server error',
      });

      await expect(getTransactionHistory()).rejects.toMatchObject({
        code: 'ORANGE_MONEY_ERROR',
      });
    });
  });

  describe('Error handling', () => {
    test('includes response details in error', async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error_code: 'INVALID_AMOUNT', error_message: 'Amount must be positive' },
        },
        message: 'Bad request',
      });

      try {
        await initPaymentSession(-100, 'ORDER-001');
      } catch (error) {
        expect(error.details).toEqual({
          error_code: 'INVALID_AMOUNT',
          error_message: 'Amount must be positive',
        });
      }
    });

    test('handles timeout errors', async () => {
      axios.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      await expect(initPaymentSession(150000, 'ORDER-001')).rejects.toMatchObject({
        code: 'ORANGE_MONEY_ERROR',
      });
    });
  });

  describe('Integration scenarios', () => {
    test('complete payment flow: init -> verify -> callback', async () => {
      // 1. Initialize session
      axios.post.mockResolvedValueOnce({
        data: {
          session_id: 'SESSION-FLOW-001',
          status: 'initiated',
          payment_url: 'https://pay.orange.com/session/SESSION-FLOW-001',
        },
      });

      const initResult = await initPaymentSession(150000, 'ORDER-FLOW-001');
      expect(initResult.sessionId).toBe('SESSION-FLOW-001');

      // 2. Verify status after payment
      axios.get.mockResolvedValueOnce({
        data: {
          session_id: 'SESSION-FLOW-001',
          status: 'paid',
          transaction_id: 'TXN-FLOW-001',
        },
      });

      const verifyResult = await verifyPaymentStatus('SESSION-FLOW-001');
      expect(verifyResult.status).toBe('paid');

      // 3. Handle callback
      const callbackResult = await handlePaymentCallback({
        session_id: 'SESSION-FLOW-001',
        status: 'paid',
        transaction_id: 'TXN-FLOW-001',
      }, null);

      expect(callbackResult.status).toBe('paid');
    });

    test('refund flow: process refund -> verify in history', async () => {
      // 1. Process refund
      axios.post.mockResolvedValueOnce({
        data: {
          refund_id: 'REFUND-FLOW-001',
          status: 'completed',
        },
      });

      const refundResult = await refundPayment('TXN-FLOW-001', 150000);
      expect(refundResult.refundId).toBe('REFUND-FLOW-001');

      // 2. Verify in history (would include refund)
      axios.get.mockResolvedValueOnce({
        data: {
          transactions: [
            { id: 'REFUND-FLOW-001', status: 'refunded' },
          ],
        },
      });

      const history = await getTransactionHistory();
      expect(history[0].id).toBe('REFUND-FLOW-001');
    });
  });
});

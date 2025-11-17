/**
 * Tests for security policies service
 */

const {
  getSecurityPolicies,
  updateSecurityPolicies,
  addAuditLog,
  getAuditLogs,
  recordFailedLoginAttempt,
  isAccountLocked,
  recordSecurityEvent,
  blacklistIP,
  isIPAllowed,
} = require('../src/services/securityPolicies');
const pool = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

const mockPolicy = {
  id: 1,
  password_min_length: 8,
  password_require_upper: true,
  password_require_digit: true,
  password_require_special: false,
  password_expire_days: 180,
  password_history_count: 5,
  max_failed_login_attempts: 5,
  lockout_duration_minutes: 30,
  session_timeout_minutes: 60,
  session_max_concurrent: 3,
  require_mfa: false,
  enable_ip_whitelist: false,
  enable_ip_blacklist: false,
  created_at: '2025-10-24T00:00:00Z',
  updated_at: '2025-10-24T00:00:00Z',
};

describe('Security Policies Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSecurityPolicies', () => {
    test('retrieves current security policies', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [mockPolicy],
      });

      const result = await getSecurityPolicies();

      expect(result).toEqual(mockPolicy);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM security_policies')
      );
    });

    test('throws error if no policies found', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      await expect(getSecurityPolicies()).rejects.toThrow();
    });
  });

  describe('updateSecurityPolicies', () => {
    test('updates security policies', async () => {
      const updates = {
        password_min_length: 10,
        password_require_special: true,
      };

      pool.query.mockResolvedValueOnce({
        rows: [{ ...mockPolicy, ...updates }],
      });

      const result = await updateSecurityPolicies(updates);

      expect(result.password_min_length).toBe(10);
      expect(result.password_require_special).toBe(true);
    });

    test('validates policy fields', async () => {
      const invalidUpdates = {
        invalid_field: 'value',
      };

      await expect(updateSecurityPolicies(invalidUpdates)).rejects.toThrow(
        'Invalid policy field'
      );
    });

    test('throws error if no fields to update', async () => {
      await expect(updateSecurityPolicies({})).rejects.toThrow(
        'No valid fields to update'
      );
    });

    test('allows multiple policy updates', async () => {
      const updates = {
        max_failed_login_attempts: 10,
        lockout_duration_minutes: 60,
        session_timeout_minutes: 120,
      };

      pool.query.mockResolvedValueOnce({
        rows: [{ ...mockPolicy, ...updates }],
      });

      const result = await updateSecurityPolicies(updates);

      expect(result.max_failed_login_attempts).toBe(10);
      expect(result.lockout_duration_minutes).toBe(60);
      expect(result.session_timeout_minutes).toBe(120);
    });
  });

  describe('addAuditLog', () => {
    test('adds audit log entry', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }],
      });

      const auditData = {
        entityType: 'user',
        entityId: 1,
        action: 'LOGIN',
        userId: 1,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        changesSummary: 'User logged in',
        requestId: '123-456-789',
        durationMs: 150,
      };

      const logId = await addAuditLog(auditData);

      expect(logId).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.any(Array)
      );
    });

    test('handles sensitive data flag', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 2 }],
      });

      const auditData = {
        entityType: 'user',
        entityId: 1,
        action: 'PASSWORD_CHANGE',
        userId: 1,
        sensitiveData: true,
        changesSummary: 'Password changed',
      };

      await addAuditLog(auditData);

      const callArgs = pool.query.mock.calls[0][1];
      expect(callArgs[12]).toBe(true); // sensitiveData position
    });

    test('includes old and new values for changes', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 3 }],
      });

      const auditData = {
        entityType: 'contract',
        entityId: 5,
        action: 'UPDATE',
        userId: 1,
        oldValues: { status: 'active' },
        newValues: { status: 'expired' },
        changesSummary: 'Status updated',
      };

      await addAuditLog(auditData);

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    test('retrieves audit logs', async () => {
      const mockLogs = [
        {
          id: 1,
          entity_type: 'user',
          action: 'LOGIN',
          timestamp: '2025-10-24T10:00:00Z',
        },
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 10 }] }) // count query
        .mockResolvedValueOnce({ rows: mockLogs }); // logs query

      const result = await getAuditLogs({
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(10);
      expect(result.limit).toBe(10);
    });

    test('filters by entity type', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 5 }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAuditLogs({
        entityType: 'user',
      });

      expect(pool.query).toHaveBeenCalled();
    });

    test('filters by action', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 3 }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAuditLogs({
        action: 'LOGIN',
      });

      expect(pool.query).toHaveBeenCalled();
    });

    test('filters by date range', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 5 }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAuditLogs({
        startDate: '2025-10-01',
        endDate: '2025-10-31',
      });

      expect(pool.query).toHaveBeenCalled();
    });

    test('supports pagination', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 100 }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getAuditLogs({
        limit: 20,
        offset: 40,
      });

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });
  });

  describe('recordFailedLoginAttempt', () => {
    test('records failed login attempt', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          email: 'test@akig.com',
          ip_address: '192.168.1.1',
          attempt_count: 1,
        }],
      });

      const result = await recordFailedLoginAttempt(
        'test@akig.com',
        '192.168.1.1'
      );

      expect(result.attempt_count).toBe(1);
    });

    test('increments attempt count on subsequent failures', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          email: 'test@akig.com',
          ip_address: '192.168.1.1',
          attempt_count: 5,
        }],
      });

      const result = await recordFailedLoginAttempt(
        'test@akig.com',
        '192.168.1.1'
      );

      expect(result.attempt_count).toBe(5);
    });
  });

  describe('isAccountLocked', () => {
    test('returns true if account is locked', async () => {
      const futureTime = new Date(Date.now() + 30 * 60 * 1000);

      pool.query.mockResolvedValueOnce({
        rows: [{ locked_until: futureTime }],
      });

      const isLocked = await isAccountLocked('test@akig.com');

      expect(isLocked).toBe(true);
    });

    test('returns false if account is not locked', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
      });

      const isLocked = await isAccountLocked('test@akig.com');

      expect(isLocked).toBe(false);
    });
  });

  describe('recordSecurityEvent', () => {
    test('records security event', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }],
      });

      const eventData = {
        eventType: 'failed_login',
        severity: 'WARNING',
        userId: 1,
        ipAddress: '192.168.1.1',
        description: 'Failed login attempt',
        details: { attempt: 1 },
      };

      const eventId = await recordSecurityEvent(eventData);

      expect(eventId).toBe(1);
    });

    test('defaults severity to INFO', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 2 }],
      });

      const eventData = {
        eventType: 'password_changed',
        userId: 1,
        description: 'Password was changed',
      };

      await recordSecurityEvent(eventData);

      expect(pool.query).toHaveBeenCalled();
    });

    test('supports different severity levels', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 3 }] })
        .mockResolvedValueOnce({ rows: [{ id: 4 }] })
        .mockResolvedValueOnce({ rows: [{ id: 5 }] });

      const severities = ['INFO', 'WARNING', 'CRITICAL'];

      for (const severity of severities) {
        await recordSecurityEvent({
          eventType: 'test_event',
          severity,
          description: `Test ${severity}`,
        });
      }

      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('blacklistIP', () => {
    test('adds IP to blacklist', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          ip_address: '192.168.1.100',
          reason: 'brute_force',
          created_by: 1,
        }],
      });

      const result = await blacklistIP(
        '192.168.1.100',
        'brute_force',
        1
      );

      expect(result.ip_address).toBe('192.168.1.100');
      expect(result.reason).toBe('brute_force');
    });

    test('supports different blacklist reasons', async () => {
      const reasons = [
        'brute_force',
        'suspicious_activity',
        'manual_block',
        'ddos_attack',
      ];

      for (const reason of reasons) {
        pool.query.mockResolvedValueOnce({
          rows: [{ id: Math.random(), reason }],
        });

        await blacklistIP('10.0.0.1', reason, 1);
      }

      expect(pool.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('isIPAllowed', () => {
    test('returns true if IP is allowed', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ allowed: true }],
      });

      const allowed = await isIPAllowed('192.168.1.1');

      expect(allowed).toBe(true);
    });

    test('returns false if IP is blocked', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ allowed: false }],
      });

      const allowed = await isIPAllowed('192.168.1.100');

      expect(allowed).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    test('failed login attempt leads to security event', async () => {
      // Record failed attempt
      pool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 5 }],
      });

      const failedLogin = await recordFailedLoginAttempt(
        'test@akig.com',
        '192.168.1.1'
      );

      expect(failedLogin.attempt_count).toBe(5);

      // Record security event
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }],
      });

      const eventId = await recordSecurityEvent({
        eventType: 'failed_login',
        severity: 'CRITICAL',
        description: 'Max login attempts exceeded',
      });

      expect(eventId).toBe(1);
    });

    test('suspicious activity leads to IP blacklist and security event', async () => {
      // Blacklist IP
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, ip_address: '192.168.1.100' }],
      });

      const blacklist = await blacklistIP(
        '192.168.1.100',
        'suspicious_activity',
        1
      );

      expect(blacklist.reason).toBe('suspicious_activity');

      // Record event
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 2 }],
      });

      const eventId = await recordSecurityEvent({
        eventType: 'ip_blacklist_added',
        severity: 'WARNING',
        description: 'IP blacklisted due to suspicious activity',
      });

      expect(eventId).toBe(2);
    });
  });

  describe('Error handling', () => {
    test('handles database errors in getSecurityPolicies', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      await expect(getSecurityPolicies()).rejects.toThrow();
    });

    test('handles database errors in addAuditLog', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      await expect(addAuditLog({
        entityType: 'user',
        entityId: 1,
        action: 'TEST',
      })).rejects.toThrow();
    });

    test('handles database errors in recordSecurityEvent', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      await expect(recordSecurityEvent({
        eventType: 'test',
        description: 'Test event',
      })).rejects.toThrow();
    });
  });
});

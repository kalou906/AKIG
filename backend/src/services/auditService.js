/**
 * Audit Service
 * Centralized access audit logging for AKIG backend
 * Tracks user access, sensitive operations, exports, and compliance
 */

const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Log access event
 * @param {Object} accessData - Access event data
 * @returns {Promise<number>} - Audit log ID
 */
async function logAccess({
  userId,
  action,
  entityType,
  entityId,
  description,
  ipAddress,
  userAgent,
  requestId = uuidv4(),
  status = 'success',
  errorMessage = null,
  oldValues = null,
  newValues = null,
  changedFields = null
}) {
  try {
    const result = await pool.query(`
      INSERT INTO access_audit (
        user_id,
        action,
        entity_type,
        entity_id,
        description,
        ip_address,
        user_agent,
        request_id,
        status,
        error_message,
        old_values,
        new_values,
        changed_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      userId,
      action,
      entityType,
      entityId,
      description,
      ipAddress,
      userAgent,
      requestId,
      status,
      errorMessage,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      changedFields
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Error logging access:', error);
    throw error;
  }
}

/**
 * Log sensitive operation (requires approval)
 * @param {Object} operationData - Operation details
 * @returns {Promise<number>} - Operation audit ID
 */
async function logSensitiveOperation({
  userId,
  operationType,
  operationCode,
  description,
  riskLevel = 'medium',
  resourceType = null,
  resourceId = null,
  resourceAmount = null,
  requiresApproval = true,
  ipAddress,
  userAgent,
  requestId = uuidv4()
}) {
  try {
    const result = await pool.query(`
      INSERT INTO sensitive_operations_audit (
        user_id,
        operation_type,
        operation_code,
        description,
        risk_level,
        resource_type,
        resource_id,
        resource_amount,
        requires_approval,
        ip_address,
        user_agent,
        request_id,
        approval_status,
        initiated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id
    `, [
      userId,
      operationType,
      operationCode,
      description,
      riskLevel,
      resourceType,
      resourceId,
      resourceAmount,
      requiresApproval,
      ipAddress,
      userAgent,
      requestId,
      requiresApproval ? 'pending' : 'auto_approved'
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Error logging sensitive operation:', error);
    throw error;
  }
}

/**
 * Log data export
 * @param {Object} exportData - Export details
 * @returns {Promise<number>} - Export audit ID
 */
async function logDataExport({
  userId,
  exportType,
  exportedRecordsCount,
  exportedFields,
  filters,
  fileName,
  fileHash,
  fileSizeBytes,
  encryptionMethod,
  deliveryMethod,
  deliveryRecipient,
  reasonCode,
  reasonDescription,
  ipAddress,
  userAgent,
  requestId = uuidv4()
}) {
  try {
    const result = await pool.query(`
      INSERT INTO data_export_audit (
        user_id,
        export_type,
        exported_records_count,
        exported_fields,
        filters,
        file_name,
        file_hash,
        file_size_bytes,
        encryption_method,
        delivery_method,
        delivery_recipient,
        reason_code,
        reason_description,
        ip_address,
        user_agent,
        request_id,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'completed')
      RETURNING id
    `, [
      userId,
      exportType,
      exportedRecordsCount,
      exportedFields,
      filters ? JSON.stringify(filters) : null,
      fileName,
      fileHash,
      fileSizeBytes,
      encryptionMethod,
      deliveryMethod,
      deliveryRecipient,
      reasonCode,
      reasonDescription,
      ipAddress,
      userAgent,
      requestId
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Error logging data export:', error);
    throw error;
  }
}

/**
 * Log login attempt
 * @param {Object} loginData - Login attempt details
 * @returns {Promise<number>} - Login audit ID
 */
async function logLoginAttempt({
  userEmail,
  userId = null,
  authMethod = 'password',
  mfaRequired = false,
  mfaVerified = false,
  success,
  failureReason = null,
  ipAddress,
  userAgent,
  countryCode = null,
  city = null,
  isVpn = false,
  isTor = false,
  riskScore = 0,
  suspicious = false
}) {
  try {
    const result = await pool.query(`
      INSERT INTO login_attempt_audit (
        user_email,
        user_id,
        auth_method,
        mfa_required,
        mfa_verified,
        success,
        failure_reason,
        ip_address,
        user_agent,
        country_code,
        city,
        is_vpn,
        is_tor,
        risk_score,
        suspicious
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `, [
      userEmail,
      userId,
      authMethod,
      mfaRequired,
      mfaVerified,
      success,
      failureReason,
      ipAddress,
      userAgent,
      countryCode,
      city,
      isVpn,
      isTor,
      riskScore,
      suspicious
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Error logging login attempt:', error);
    throw error;
  }
}

/**
 * Log permission change
 * @param {Object} changeData - Permission change details
 * @returns {Promise<number>} - Change audit ID
 */
async function logPermissionChange({
  changedBy,
  userId,
  changeType,
  roleName = null,
  permissionCode = null,
  previousRoles = null,
  newRoles = null,
  previousPermissions = null,
  newPermissions = null,
  changeReason = null,
  justification = null,
  requiresApproval = false,
  approvedBy = null,
  ipAddress,
  requestId = uuidv4()
}) {
  try {
    const result = await pool.query(`
      INSERT INTO permission_change_audit (
        changed_by,
        user_id,
        change_type,
        role_name,
        permission_code,
        previous_roles,
        new_roles,
        previous_permissions,
        new_permissions,
        change_reason,
        justification,
        requires_approval,
        ip_address,
        request_id,
        effective_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id
    `, [
      changedBy,
      userId,
      changeType,
      roleName,
      permissionCode,
      previousRoles,
      newRoles,
      previousPermissions,
      newPermissions,
      changeReason,
      justification,
      requiresApproval,
      ipAddress,
      requestId
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Error logging permission change:', error);
    throw error;
  }
}

/**
 * Log API token usage
 * @param {Object} usageData - API token usage details
 * @returns {Promise<number>} - Token usage audit ID
 */
async function logApiTokenUsage({
  tokenId,
  userId,
  endpointPath,
  httpMethod,
  requestBodySize,
  responseStatusCode,
  responseSize,
  responseTimeMs,
  ipAddress,
  userAgent
}) {
  try {
    const result = await pool.query(`
      INSERT INTO api_token_usage_audit (
        token_id,
        user_id,
        endpoint_path,
        http_method,
        request_body_size,
        response_status_code,
        response_size,
        response_time_ms,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      tokenId,
      userId,
      endpointPath,
      httpMethod,
      requestBodySize,
      responseStatusCode,
      responseSize,
      responseTimeMs,
      ipAddress,
      userAgent
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Error logging API token usage:', error);
    throw error;
  }
}

/**
 * Approve sensitive operation
 * @param {number} operationId - Operation ID
 * @param {number} approvedBy - User ID approving
 * @param {string} approvalReason - Reason for approval
 * @returns {Promise<void>}
 */
async function approveSensitiveOperation(operationId, approvedBy, approvalReason) {
  try {
    await pool.query(`
      UPDATE sensitive_operations_audit
      SET approval_status = 'approved',
          approved_by = $1,
          approved_at = NOW(),
          approval_reason = $2,
          completed_at = NOW()
      WHERE id = $3
    `, [approvedBy, approvalReason, operationId]);
  } catch (error) {
    console.error('Error approving sensitive operation:', error);
    throw error;
  }
}

/**
 * Reject sensitive operation
 * @param {number} operationId - Operation ID
 * @param {number} rejectedBy - User ID rejecting
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<void>}
 */
async function rejectSensitiveOperation(operationId, rejectedBy, rejectionReason) {
  try {
    await pool.query(`
      UPDATE sensitive_operations_audit
      SET approval_status = 'rejected',
          approved_by = $1,
          approved_at = NOW(),
          approval_reason = $2
      WHERE id = $3
    `, [rejectedBy, rejectionReason, operationId]);
  } catch (error) {
    console.error('Error rejecting sensitive operation:', error);
    throw error;
  }
}

/**
 * Get user activity summary
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User activity summary
 */
async function getUserActivitySummary(userId) {
  try {
    const result = await pool.query(`
      SELECT * FROM user_activity_summary WHERE id = $1
    `, [userId]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user activity summary:', error);
    throw error;
  }
}

/**
 * Get pending approvals
 * @returns {Promise<Array>} - Pending operations
 */
async function getPendingApprovals() {
  try {
    const result = await pool.query(`
      SELECT * FROM pending_approvals
    `);

    return result.rows;
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    throw error;
  }
}

/**
 * Get failed login analysis
 * @returns {Promise<Array>} - Failed login analysis
 */
async function getFailedLoginAnalysis() {
  try {
    const result = await pool.query(`
      SELECT * FROM failed_login_analysis
    `);

    return result.rows;
  } catch (error) {
    console.error('Error getting failed login analysis:', error);
    throw error;
  }
}

/**
 * Generate compliance report
 * @param {Object} reportOptions - Report configuration
 * @returns {Promise<Object>} - Compliance report
 */
async function generateComplianceReport({
  reportType,
  title,
  description,
  startDate,
  endDate,
  userIds = null,
  entityTypes = null,
  generatedBy
}) {
  try {
    // Fetch audit data based on filters
    let query = 'SELECT * FROM access_audit WHERE created_at BETWEEN $1 AND $2';
    const params = [startDate, endDate];

    if (userIds && userIds.length > 0) {
      query += ` AND user_id = ANY($${params.length + 1})`;
      params.push(userIds);
    }

    if (entityTypes && entityTypes.length > 0) {
      query += ` AND entity_type = ANY($${params.length + 1})`;
      params.push(entityTypes);
    }

    const auditData = await pool.query(query, params);

    // Create report
    const reportResult = await pool.query(`
      INSERT INTO compliance_reports (
        report_type,
        title,
        description,
        start_date,
        end_date,
        user_ids,
        entity_types,
        content,
        total_records,
        generated_by,
        generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id, generated_at
    `, [
      reportType,
      title,
      description,
      startDate,
      endDate,
      userIds,
      entityTypes,
      JSON.stringify(auditData.rows),
      auditData.rows.length,
      generatedBy
    ]);

    return {
      reportId: reportResult.rows[0].id,
      generatedAt: reportResult.rows[0].generated_at,
      totalRecords: auditData.rows.length,
      data: auditData.rows
    };
  } catch (error) {
    console.error('Error generating compliance report:', error);
    throw error;
  }
}

/**
 * Cleanup old audit logs (retention policy)
 * @param {number} retentionDays - Days to retain
 * @returns {Promise<number>} - Number of deleted records
 */
async function cleanupOldAuditLogs(retentionDays) {
  try {
    const result = await pool.query(`
      SELECT cleanup_old_audit_logs($1) as deleted_count
    `, [retentionDays]);

    return result.rows[0].deleted_count;
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    throw error;
  }
}

/**
 * Get audit trail for entity
 * @param {string} entityType - Entity type
 * @param {number} entityId - Entity ID
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} - Audit trail
 */
async function getAuditTrail(entityType, entityId, limit = 100) {
  try {
    const result = await pool.query(`
      SELECT 
        aa.*,
        u.email as user_email
      FROM access_audit aa
      JOIN users u ON aa.user_id = u.id
      WHERE aa.entity_type = $1 AND aa.entity_id = $2
      ORDER BY aa.created_at DESC
      LIMIT $3
    `, [entityType, entityId, limit]);

    return result.rows;
  } catch (error) {
    console.error('Error getting audit trail:', error);
    throw error;
  }
}

module.exports = {
  logAccess,
  logSensitiveOperation,
  logDataExport,
  logLoginAttempt,
  logPermissionChange,
  logApiTokenUsage,
  approveSensitiveOperation,
  rejectSensitiveOperation,
  getUserActivitySummary,
  getPendingApprovals,
  getFailedLoginAnalysis,
  generateComplianceReport,
  cleanupOldAuditLogs,
  getAuditTrail
};

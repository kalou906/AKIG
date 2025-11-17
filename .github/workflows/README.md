# 🔄 AKIG GitHub Actions Workflows

## Overview

Automated testing and operations workflows for AKIG platform.

## Available Workflows

### 1. 🔄 PRA (Disaster Recovery Test)
**File**: `pra.yml`  
**Schedule**: Every Saturday at 02:00 UTC  
**Manual Trigger**: Yes

**Jobs**:
- `pra-backup` - Tests backup functionality and compression
- `pra-restore` - Tests restore procedure and data integrity
- `pra-health-check` - Verifies all PRA files are present
- `notification` - Sends test results via Slack

**Secrets Required**:
- `PG_HOST` - PostgreSQL host
- `PG_USER` - Database user
- `PG_PASSWORD` - Database password
- `SLACK_WEBHOOK` - Slack notification webhook (optional)

**Success Criteria**:
- Backup completes successfully
- Restore completes in < 30 minutes
- Data integrity verified
- All health checks pass

---

### 2. 🔔 Alert System Tests
**File**: `alerts-test.yml`  
**Schedule**: Every Saturday at 03:00 UTC (after PRA)  
**Manual Trigger**: Yes

**Jobs**:
- `setup` - Prepare test environment
- `test-alert-service` - Test alert service
- `test-alert-channels` - Test all delivery channels
- `test-alert-routing` - Test alert routing logic
- `test-alert-persistence` - Test alert logging
- `test-alert-cleanup` - Test old alert cleanup
- `summary` - Generate test report

**Channels Tested**:
- ✅ Email (SendGrid)
- ✅ SMS (Twilio)
- ✅ Slack
- ✅ Webhooks
- ✅ In-App

**Secrets Required**:
- `SENDGRID_API_KEY` - Email provider
- `TWILIO_ACCOUNT_SID` - SMS provider
- `TWILIO_AUTH_TOKEN` - SMS auth
- `SLACK_WEBHOOK` - Slack webhook
- `TEST_PHONE_NUMBER` - Phone for SMS test
- `TEST_WEBHOOK_URL` - Custom webhook endpoint

---

### 3. 🎨 Widgets System Tests
**File**: `widgets-test.yml`  
**Schedule**: Every Saturday at 04:00 UTC (after alerts)  
**Manual Trigger**: Yes  
**PR Trigger**: On changes to widget files

**Jobs**:
- `backend-tests` - Unit tests with coverage
- `api-tests` - API endpoint tests
- `integration-tests` - CRUD operations
- `frontend-tests` - Dashboard component
- `performance-tests` - Load testing
- `report` - Generate test report

**Test Coverage**:
- ✅ CRUD operations
- ✅ Drag-drop reordering
- ✅ Visibility toggle
- ✅ Dynamic data loading
- ✅ All 9 widget types
- ✅ Performance baseline

**Secrets Required**: None (uses test database)

---

### 4. 📊 Daily Backup
**File**: `daily-backup.yml`  
**Schedule**: Every day at 01:00 UTC  
**Manual Trigger**: Yes

**Purpose**: Automated daily backup of production database

**Secrets Required**:
- `PG_HOST` - Production database
- `PG_USER` - Database user
- `PG_PASSWORD` - Database password

---

### 5. 🔐 Security & Dependencies
**File**: `deps-security.yml`  
**Schedule**: Every week on Monday at 00:00 UTC

**Features**:
- Dependency scanning
- Vulnerability detection
- Auto-update of secure versions
- Security advisories

---

### 6. 🔑 Key Rotation
**File**: `key-rotation.yml`  
**Schedule**: Every month on 1st at 00:00 UTC

**Features**:
- JWT secret rotation
- API key rotation
- Credential management
- Audit logging

---

### 7. ⚡ Performance Tests
**File**: `perf.yml`  
**Schedule**: Every week on Wednesday at 14:00 UTC

**Tests**:
- API response times
- Database query performance
- Widget data loading
- Frontend rendering

---

### 8. 🖥️ UI Tests
**File**: `ui.yml`  
**Schedule**: Every day at 06:00 UTC  
**PR Trigger**: On frontend changes

**Tests**:
- Component rendering
- User interactions
- Responsive design
- Accessibility

---

### 9. 🔄 Cron Jobs
**File**: `cron.yml`  
**Schedule**: Various

**Tasks**:
- Alert cleanup
- Log rotation
- Cache invalidation
- Report generation

---

## Weekly Testing Schedule

```
Saturday
  02:00 UTC ├─ 🔄 PRA Backup Test (60 min)
  03:00 UTC ├─ 🔔 Alert System Tests (30 min)
  04:00 UTC └─ 🎨 Widget System Tests (30 min)

Monday
  00:00 UTC ├─ 🔐 Security & Dependencies

Wednesday
  14:00 UTC └─ ⚡ Performance Tests

Daily
  01:00 UTC ├─ 📊 Daily Backup
  06:00 UTC └─ 🖥️ UI Tests
```

## Configuration

### Adding Secrets

Go to: Repository → Settings → Secrets and variables → Actions

Required secrets by workflow:

**PRA Workflow**:
```
PG_HOST=db.example.com
PG_USER=akig
PG_PASSWORD=***
SLACK_WEBHOOK=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@example.com
```

**Alerts Workflow**:
```
SENDGRID_API_KEY=SG.***
TWILIO_ACCOUNT_SID=AC***
TWILIO_AUTH_TOKEN=***
TEST_PHONE_NUMBER=+33612345678
SLACK_WEBHOOK=https://hooks.slack.com/services/...
TEST_WEBHOOK_URL=https://webhook.site/...
```

### Manual Trigger

Each workflow can be triggered manually:

1. Go to: Actions tab
2. Select workflow
3. Click "Run workflow"
4. Configure inputs if needed
5. Click green "Run" button

## Monitoring

### View Workflow Runs

1. Go to: Actions tab
2. Select workflow
3. View run history and logs

### Slack Notifications

Workflows send notifications to configured Slack channel:
- ✅ Success (green)
- ❌ Failure (red)
- ⚠️ Warnings (yellow)

### Email Alerts

On critical failures, emails sent to:
- ops-team@example.com
- cto@example.com

## Troubleshooting

### Workflow Failed

1. Click on failed run
2. Expand "Logs" section
3. Look for error messages
4. Check "Annotations" tab for details

### Secrets Not Found

- Verify secrets exist in Settings
- Check secret name spelling
- Ensure secrets are not prefixed in workflow

### Database Connection Issues

- Verify database is online
- Check credentials are correct
- Verify network access from GitHub Actions
- Check database firewall rules

### Timeout Issues

- Increase timeout-minutes
- Optimize slow queries
- Add parallel jobs
- Split into smaller workflows

## Best Practices

1. **Monitor Workflow Status**
   - Check weekly runs
   - Review failure logs
   - Set up Slack notifications

2. **Keep Secrets Secure**
   - Rotate regularly
   - Use separate keys per environment
   - Never commit secrets

3. **Test Locally First**
   - Run scripts locally
   - Test backup/restore manually
   - Validate alerts work

4. **Update Documentation**
   - Keep procedures current
   - Document changes
   - Share learnings with team

## Emergency Access

If workflows fail during critical time:

1. **Manual Backup**:
   ```bash
   cd ops/pra
   ./backup.sh --full
   ```

2. **Manual Restore**:
   ```bash
   cd ops/pra
   export BACKUP_FILE=/path/to/backup.sql.gz
   ./restore_run.sh
   ```

3. **Check Status**:
   ```bash
   cd ops/pra
   ./status.sh
   ```

## Support

- **Documentation**: See `ops/pra/README.md`
- **Emergency**: ops-oncall@example.com
- **Questions**: ops@example.com

---

**Last Updated**: October 25, 2025  
**Status**: 🟢 All workflows operational  
**Next Review**: November 25, 2025

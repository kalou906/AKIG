# 🔧 GitHub Actions Workflows - Management Guide

## Quick Start

### Enable a Workflow

1. Go to: **Actions** tab in repository
2. Select workflow from list
3. Click **Enable workflow** (if disabled)
4. Workflow will run on schedule

### Disable a Workflow

1. Go to: **Actions** → Select workflow
2. Click **...** menu
3. Select **Disable workflow**
4. Workflow will stop running

### Manual Trigger

1. Go to: **Actions** → Select workflow
2. Click **Run workflow**
3. Choose branch (usually main)
4. Click **Run**

## Workflow Files

All workflows are located in: `.github/workflows/`

### Available Workflows

| Workflow | File | Schedule | Trigger |
|----------|------|----------|---------|
| PRA Test | pra.yml | Sat 02:00 UTC | Manual ✅ |
| Alerts Test | alerts-test.yml | Sat 03:00 UTC | Manual ✅ |
| Widgets Test | widgets-test.yml | Sat 04:00 UTC | Manual ✅ |
| Daily Backup | daily-backup.yml | Daily 01:00 UTC | Manual ✅ |
| Security | deps-security.yml | Mon 00:00 UTC | No |
| Performance | perf.yml | Wed 14:00 UTC | Manual ✅ |
| UI Tests | ui.yml | Daily 06:00 UTC | Manual ✅ |

## Secrets Management

### View Secrets

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. All secrets are listed here
3. Click secret to view (value hidden)

### Add New Secret

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Enter name (e.g., `PG_PASSWORD`)
4. Enter value
5. Click **Add secret**

### Update Secret

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Find secret
3. Click **Update**
4. Enter new value
5. Click **Update secret**

### Delete Secret

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Find secret
3. Click **...** → **Delete**

### Required Secrets

**PRA Workflow**:
- `PG_HOST` - Database host
- `PG_USER` - Database user
- `PG_PASSWORD` - Database password

**Alerts Workflow**:
- `SENDGRID_API_KEY` - Email API key
- `TWILIO_ACCOUNT_SID` - SMS account
- `TWILIO_AUTH_TOKEN` - SMS token

**Optional**:
- `SLACK_WEBHOOK` - Slack notifications
- `ALERT_EMAIL` - Alert email address

## Monitoring Workflows

### View Workflow Status

1. Go to: **Actions** tab
2. See list of recent runs
3. Green ✅ = Success
4. Red ❌ = Failed
5. Yellow ⟳ = In Progress

### View Run Details

1. Click on workflow run
2. See all jobs in left sidebar
3. Click job to expand details
4. View logs for each step

### View Logs

1. Click job name to expand
2. Click step to see logs
3. Search logs with Ctrl+F
4. Download logs as file

### Common Log Locations

```
✓ Setup logs      → Look for "Setup" step
✓ Test logs       → Look for "npm test"
✓ Database logs   → Look for "PostgreSQL"
✓ Error logs      → Look for "Error" or "✗"
✓ Cleanup logs    → Look for "Cleanup"
```

## Troubleshooting

### Workflow Failed

**Steps**:
1. Click failed run
2. Find failed job (red ❌)
3. Click job to expand
4. Find failed step
5. Read error message
6. Fix issue locally first
7. Push fix to repository

**Common Issues**:

| Error | Cause | Fix |
|-------|-------|-----|
| Secrets not found | Typo or missing secret | Check secret name spelling |
| DB connection error | Invalid credentials | Update secrets |
| Timeout | Slow test | Increase timeout or optimize |
| Build failed | Syntax error | Test locally first |
| Permission denied | Script not executable | Add chmod +x |

### Workflow Stuck

**Steps**:
1. Go to Actions tab
2. Find stuck workflow
3. Click **...** → **Cancel**
4. Investigate root cause
5. Fix issue
6. Retry manually

### Workflow Not Running

**Possible Causes**:
1. Workflow is disabled
2. Branch is not main
3. Syntax error in YAML
4. Cron schedule not met
5. Insufficient permissions

**Fix**:
1. Enable workflow
2. Check on main branch
3. Validate YAML syntax
4. Check schedule is correct
5. Verify user permissions

### Performance Issues

**Slow Runs**:
1. Check job duration
2. Identify slow steps
3. Optimize slow steps
4. Consider parallel jobs
5. Use caching

**Steps to Optimize**:
```yaml
# Use caching
cache: 'npm'

# Install only necessary packages
npm ci  # Instead of npm install

# Use matrix for parallel jobs
strategy:
  matrix:
    node-version: [16, 18, 20]

# Increase parallelism
# Run multiple jobs simultaneously
```

## Creating New Workflows

### 1. Copy Template

```bash
cp .github/workflows/TEMPLATE.yml \
   .github/workflows/my-workflow.yml
```

### 2. Customize Template

- Change `name:` field
- Update trigger conditions (`on:`)
- Modify jobs and steps
- Add your commands

### 3. Add Secrets (if needed)

1. Go to Settings → Secrets
2. Add required secrets
3. Reference with: `${{ secrets.NAME }}`

### 4. Test Workflow

1. Push to branch
2. Go to Actions tab
3. Trigger manually
4. Check logs for errors
5. Iterate until working

### 5. Deploy to Main

1. Merge to main branch
2. Workflow activates
3. Runs on schedule or trigger

### Example: Create Daily Report Workflow

```yaml
name: Daily Report

on:
  schedule:
    - cron: '0 8 * * MON'  # Monday 8 AM

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run report:generate
      - run: npm run report:email
        env:
          EMAIL: ${{ secrets.REPORT_EMAIL }}
```

## Best Practices

### 1. Workflow Design

✅ **DO**:
- Keep workflows focused (one job = one purpose)
- Use descriptive names
- Add comments to complex steps
- Use timeouts to prevent hangs
- Cache dependencies

❌ **DON'T**:
- Mix multiple concerns in one workflow
- Use vague names
- Skip error handling
- Leave timeouts at default
- Ignore slow steps

### 2. Security

✅ **DO**:
- Use secrets for sensitive data
- Rotate secrets regularly
- Minimize secret exposure
- Audit secret access
- Use service accounts

❌ **DON'T**:
- Commit secrets to git
- Use personal tokens
- Share secrets via email
- Log sensitive data
- Hardcode credentials

### 3. Performance

✅ **DO**:
- Cache dependencies
- Use matrix for parallel jobs
- Reuse actions
- Minimize checkout time
- Use concurrency limits

❌ **DON'T**:
- Install unnecessary packages
- Run sequential jobs when parallel possible
- Download large artifacts
- Skip caching
- Run too many jobs simultaneously

### 4. Monitoring

✅ **DO**:
- Check workflows weekly
- Review failed runs
- Monitor performance
- Update schedules as needed
- Archive old logs

❌ **DON'T**:
- Ignore failures
- Skip performance checks
- Leave broken workflows
- Ignore slow trends
- Delete logs prematurely

## Commands Reference

### Local Testing

```bash
# Lint workflow YAML
yamllint .github/workflows/*.yml

# Check workflow syntax
python -m json.tool < .github/workflows/my-workflow.yml

# View workflow details
gh workflow view my-workflow.yml

# List all workflows
gh workflow list

# Run workflow manually
gh workflow run my-workflow.yml
```

### Debugging

```bash
# View recent runs
gh run list

# View specific run
gh run view <run-id>

# View run logs
gh run view <run-id> --log

# Cancel run
gh run cancel <run-id>

# Rerun workflow
gh run rerun <run-id>
```

## Emergency Procedures

### Disable All Workflows

If workflows are causing issues:

1. Go to Settings
2. Under Actions, select "Disable all workflows"
3. This pauses all automated actions
4. Re-enable when issues resolved

### Manual Operations

If workflows fail:

```bash
# PRA Backup
cd ops/pra
./backup.sh --full

# Alert Test
cd backend
npm test -- tests/alerts.test.js

# Widget Test
cd backend
npm test -- tests/widgets.test.js
```

### Emergency Contacts

- **Slack**: #infrastructure
- **Email**: ops@example.com
- **Emergency**: ops-oncall@example.com

## Documentation

### Workflow Documentation

- Main guide: `README.md` (in this directory)
- Template: `TEMPLATE.yml` (copy to create new)
- Each workflow has comments explaining steps

### PRA Documentation

- Guide: `ops/pra/README.md`
- Procedures: `ops/pra/RUNBOOK.md`
- Troubleshooting: `ops/pra/README.md` (Dépannage section)

## Support

**Questions about workflows?**
1. Check `README.md` first
2. Review workflow comments
3. Check GitHub Actions documentation
4. Contact: ops@example.com

**Workflow not working?**
1. Check logs in Actions tab
2. Review error messages
3. Run locally to test
4. Update secrets if needed
5. Contact on-call if urgent

---

**Last Updated**: October 25, 2025  
**Version**: 1.0  
**Status**: 🟢 All workflows operational

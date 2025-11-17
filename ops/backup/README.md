# AKIG Database Backup & Restore System

Complete backup, restore, and recovery solution for PostgreSQL databases with automated scheduling, validation, and testing.

## Features

- ✅ **Automated Backups**: Daily compressed backups with rotation
- ✅ **Restore Testing**: Weekly validation of backup integrity
- ✅ **Metadata Tracking**: MD5 checksums, timestamps, database info
- ✅ **Point-in-Time Recovery**: Support for multiple restore scenarios
- ✅ **Comprehensive Logging**: Detailed logs with structured output
- ✅ **Error Handling**: Robust error detection and recovery
- ✅ **Data Validation**: Verify restored data integrity
- ✅ **Scheduling**: Systemd timers or cron job support

## Quick Start

### Installation

```bash
# Install scripts
sudo cp restore_backup.sh /opt/akig/ops/backup/
sudo cp restore_test.sh /opt/akig/ops/backup/
sudo cp schedule_backup.sh /opt/akig/ops/backup/
sudo chmod +x /opt/akig/ops/backup/*.sh

# Set up automated scheduling
sudo /opt/akig/ops/backup/schedule_backup.sh install systemd

# Verify installation
/opt/akig/ops/backup/schedule_backup.sh status
```

### Manual Backup

```bash
# Create a backup
./restore_backup.sh backup

# View available backups
./restore_backup.sh list

# Show backup details
./restore_backup.sh info ./2024-01-15.dump
```

### Manual Restore

```bash
# Restore from specific backup
./restore_backup.sh restore ./2024-01-15.dump

# Restore to custom database name
./restore_backup.sh restore ./2024-01-15.dump my_test_db

# The restored database will be named: akig_restore (or custom name)
```

### Test Restore

```bash
# Run full backup/restore test cycle
./restore_backup.sh test

# Run dedicated test with validation
./restore_test.sh
```

## Environment Variables

```bash
# PostgreSQL Connection
PG_HOST=localhost              # Default: localhost
PG_PORT=5432                   # Default: 5432
PG_USER=postgres               # Default: postgres
PG_PASSWORD=secret             # Required for non-local auth
PG_DATABASE=akig               # Default: akig

# Storage & Retention
BACKUP_DIR=/var/backups/akig   # Default: ./backups
LOG_DIR=/var/log/akig          # Default: ./logs
ARCHIVE_DIR=/archive/akig      # Default: ./archive
RETENTION_DAYS=30              # Default: 30
```

## Usage Examples

### Daily Backup with Password

```bash
PG_PASSWORD=mypassword ./restore_backup.sh backup
```

### Restore to Test Database

```bash
./restore_backup.sh restore ./2024-01-15.dump akig_test
psql -U postgres -d akig_test -c "SELECT count(*) FROM invoices;"
```

### List All Backups

```bash
./restore_backup.sh list

# Output:
# Available backups:
# Filename                 Size            Created
# ================================================================
# 2024-01-15.dump          45.2M           2024-01-15 02:00:00
# 2024-01-14.dump          44.8M           2024-01-14 02:00:00
# 2024-01-13.dump          46.1M           2024-01-13 02:00:00
```

### View Backup Information

```bash
./restore_backup.sh info ./2024-01-15.dump

# Output:
# === Backup Information ===
# File: ./2024-01-15.dump
# Size: 45.2M
# Modified: 2024-01-15 02:00:00
#
# === Metadata ===
# {
#   "created_at": "2024-01-15T02:00:00Z",
#   "database": "akig",
#   "host": "localhost",
#   "port": 5432,
#   "file_size": 47405209,
#   "file_size_human": "45.2M",
#   "checksum": "a1b2c3d4e5f6...",
#   "table_count": "25",
#   "database_size": "48.5M"
# }
```

### Cleanup Old Backups

```bash
# Archive backups older than 30 days
./restore_backup.sh cleanup

# Results in:
# - Old backups moved to ./archive/backup_archived_*.tar.gz
# - Temporary restore databases dropped
```

### Run Test Cycle

```bash
./restore_backup.sh test

# Performs:
# 1. Create backup
# 2. Restore to test database
# 3. Validate restored data
# 4. Verify table counts
# 5. Check data integrity
# 6. Cleanup test database
```

### Run Restore Test

```bash
./restore_test.sh

# Comprehensive test including:
# 1. Find latest backup
# 2. Create test database
# 3. Execute restore
# 4. Count invoices/contracts/users
# 5. Verify schema integrity
# 6. Run data integrity checks
# 7. Test query performance
# 8. Cleanup
# 9. Generate report
```

## Automated Scheduling

### Systemd Timers (Recommended)

Install and verify:

```bash
sudo ./schedule_backup.sh install systemd
./schedule_backup.sh status
```

View upcoming scheduled times:

```bash
systemctl list-timers akig-backup.timer akig-backup-test.timer
```

View timer logs:

```bash
journalctl -u akig-backup.timer -f
journalctl -u akig-backup.service -f
```

### Cron Jobs (Legacy)

```bash
sudo ./schedule_backup.sh install cron
```

Cron schedule:

```
# Daily backup at 2:00 AM
0 2 * * * postgres /opt/akig/ops/backup/restore_backup.sh backup

# Weekly restore test on Sunday at 3:00 AM
0 3 * * 0 postgres /opt/akig/ops/backup/restore_test.sh

# Cleanup old backups Monday at 1:00 AM
0 1 * * 1 postgres /opt/akig/ops/backup/restore_backup.sh cleanup
```

## Backup Structure

```
/var/backups/akig/
├── 2024-01-15.dump          # Compressed backup file
├── 2024-01-15.dump.meta     # Metadata JSON file
├── 2024-01-14.dump
├── 2024-01-14.dump.meta
└── ...

/var/log/akig/
├── backup.log               # Backup operation logs
├── restore_test.log         # Restore test logs
└── backup_restore_*.log     # Individual operation logs

/archive/akig/
├── backup_archived_*.tar.gz  # Archived old backups
└── ...
```

## Metadata Files

Each backup includes a `.meta` file with:

```json
{
  "created_at": "2024-01-15T02:00:00Z",
  "database": "akig",
  "host": "localhost",
  "port": 5432,
  "file_size": 47405209,
  "file_size_human": "45.2M",
  "checksum": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "table_count": "25",
  "database_size": "48.5M"
}
```

## Recovery Scenarios

### Scenario 1: Full Database Recovery

```bash
# Find backup
./restore_backup.sh list

# Restore to new database
./restore_backup.sh restore ./2024-01-15.dump akig_recovered

# Verify data
psql -U postgres -d akig_recovered -c "SELECT count(*) FROM invoices;"

# If successful, rename/swap databases
psql -U postgres -c "DROP DATABASE akig;"
psql -U postgres -c "ALTER DATABASE akig_recovered RENAME TO akig;"
```

### Scenario 2: Point-in-Time Recovery

```bash
# Get backup before disaster
./restore_backup.sh list

# Restore to test database
./restore_backup.sh restore ./2024-01-10.dump akig_point_in_time

# Query and verify specific data
psql -U postgres -d akig_point_in_time -c \
  "SELECT * FROM invoices WHERE created_at > '2024-01-08' AND created_at < '2024-01-10';"

# Copy data to production if needed
pg_dump -U postgres akig_point_in_time > recovery_data.sql
```

### Scenario 3: Partial Recovery

```bash
# Restore specific tables to test database
./restore_backup.sh restore ./2024-01-15.dump akig_partial

# Extract and import specific table
pg_dump -U postgres -t invoices akig_partial > invoices.sql
psql -U postgres -d akig < invoices.sql
```

## Monitoring & Health Checks

### Check Backup Status

```bash
# List recent backups
ls -lh /var/backups/akig/*.dump | tail -5

# Check backup size trend
du -sh /var/backups/akig/*.dump

# Find largest backups
du -sh /var/backups/akig/*.dump | sort -h | tail -10
```

### Monitor Restore Tests

```bash
# View latest test results
tail -50 /var/log/akig/restore_test.log

# Count successful tests (last 30 days)
grep "SUCCESS" /var/log/akig/restore_test.log | wc -l

# Find failed tests
grep "FAILED\|VALIDATION_FAILED" /var/log/akig/restore_test.log
```

### Alert Conditions

Monitor for:

1. **No recent backups** (> 26 hours old)
2. **Backup size anomalies** (100% change from average)
3. **Failed restore tests**
4. **Disk space warnings** (< 10% free in backup dir)
5. **Backup duration increase** (> 2x normal)

## Troubleshooting

### Connection Errors

```bash
# Test connection directly
PGPASSWORD=secret psql -h localhost -U postgres -d akig -c "SELECT 1;"

# Check PostgreSQL is running
systemctl status postgresql

# Verify credentials
echo "localhost:5432:akig:postgres:$PG_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass
psql -h localhost -U postgres -d akig -c "SELECT 1;"
```

### Backup/Restore Failures

```bash
# Enable debug logging
bash -x ./restore_backup.sh backup 2>&1 | tee debug.log

# Check disk space
df -h /var/backups/akig

# Monitor process
watch -n 1 'ps aux | grep pg_'
```

### Restore Database Cleanup

```bash
# List all restore databases
psql -U postgres -lqt | cut -d'|' -f1 | grep _restore

# Drop specific restore database
dropdb -U postgres akig_restore

# Drop all restore databases
for db in $(psql -U postgres -lqt | cut -d'|' -f1 | grep _restore); do
  dropdb -U postgres "$db"
done
```

## Performance Tuning

### Backup Performance

```bash
# For large databases, consider adjusting:
# - Buffer size: increase for faster backups
# - Compression: 9 is slower but smaller files
# - Jobs: parallel backup jobs (if supported)

# Example: reduce compression for speed
pg_dump -h localhost -U postgres -d akig \
  --format=custom --compress=6 > backup.dump
```

### Restore Performance

```bash
# For faster restore to test database:
# - Disable logging temporarily
# - Increase maintenance_work_mem
# - Disable indexes during restore (if applicable)

psql -U postgres -d akig_restore -c \
  "SET maintenance_work_mem = '2GB';"
```

## Security

### File Permissions

```bash
# Backups should only be readable by postgres user
sudo chown postgres:postgres /var/backups/akig/*
sudo chmod 600 /var/backups/akig/*.dump
sudo chmod 600 /var/backups/akig/*.meta
```

### Encryption (Optional)

```bash
# Encrypt backup with GPG
gpg --symmetric --cipher-algo AES256 backup.dump

# Restore encrypted backup
gpg --decrypt backup.dump.gpg | pg_restore -U postgres -d akig -
```

### Remote Backups

```bash
# Copy backup to remote server
rsync -avz --delete /var/backups/akig/ backup@remote.server:/backups/akig/

# Or using S3
aws s3 sync /var/backups/akig/ s3://my-bucket/akig-backups/
```

## Maintenance

### Regular Tasks

- **Weekly**: Review restore test logs for failures
- **Monthly**: Verify backup integrity with sample restores
- **Quarterly**: Clean up old archived backups
- **Yearly**: Document and test disaster recovery procedures

### Update Scripts

```bash
# Pull latest versions
git -C /opt/akig/ops/backup pull

# Test before deploying
./restore_backup.sh verify
```

## Support

For issues:

1. Check logs: `/var/log/akig/`
2. Run verification: `./restore_backup.sh verify`
3. Test manually: `./restore_backup.sh test`
4. Review PostgreSQL logs: `/var/log/postgresql/`

## License

AKIG Database Backup System - Part of AKIG Platform

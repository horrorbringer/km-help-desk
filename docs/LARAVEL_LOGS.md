# Laravel Log Management

## Overview

This guide explains how to access and manage Laravel application logs in the KM Help Desk project.

## Log Location

Laravel logs are stored in: `storage/logs/laravel.log`

## Checking Logs

### Method 1: Direct File Access (Recommended)

Since `storage/` is mounted as a volume in Docker, you can access logs directly from your host machine:

```bash
# View recent log entries
tail -20 storage/logs/laravel.log

# Follow logs in real-time (like tail -f)
tail -f storage/logs/laravel.log

# View last 50 entries
tail -50 storage/logs/laravel.log
```

### Method 2: Via Docker Container

You can also access logs through the Docker container:

```bash
# View recent logs
docker-compose exec app tail -20 storage/logs/laravel.log

# Follow logs in real-time
docker-compose exec app tail -f storage/logs/laravel.log
```

## Log Analysis

### Search by Log Level

```bash
# Errors only
grep "ERROR\|CRITICAL\|ALERT\|EMERGENCY" storage/logs/laravel.log

# Info messages
grep "INFO" storage/logs/laravel.log

# Warnings
grep "WARNING\|NOTICE" storage/logs/laravel.log
```

### Search by Date/Time

```bash
# Today's logs only
grep "$(date +%Y-%m-%d)" storage/logs/laravel.log

# Last hour
grep "$(date -d '1 hour ago' +'%Y-%m-%d %H')" storage/logs/laravel.log
```

### Search by Content

```bash
# Database errors
grep "SQLSTATE\|QueryException" storage/logs/laravel.log

# Permission errors
grep "Permission denied\|Forbidden" storage/logs/laravel.log

# Email-related logs
grep "SendTicketAssignedEmailJob\|email" storage/logs/laravel.log

# Approval workflow logs
grep "ApprovalWorkflowService\|TicketApproval" storage/logs/laravel.log
```

## Log Maintenance

### Backup Logs

```bash
# Create timestamped backup
cp storage/logs/laravel.log "storage/logs/laravel-$(date +%Y%m%d-%H%M%S).log"
```

### Clear Logs

```bash
# Backup first, then clear
cp storage/logs/laravel.log storage/logs/laravel.log.backup
> storage/logs/laravel.log
```

### Rotate Logs

```bash
# Move current log to dated file
mv storage/logs/laravel.log "storage/logs/laravel-$(date +%Y%m%d).log"
# Laravel will create new log file automatically
```

## Log Levels

Laravel uses standard PSR-3 log levels:

- `EMERGENCY` - System is unusable
- `ALERT` - Action must be taken immediately
- `CRITICAL` - Critical conditions
- `ERROR` - Runtime errors
- `WARNING` - Exceptional occurrences
- `NOTICE` - Normal but significant events
- `INFO` - Informational messages
- `DEBUG` - Debug-level messages

## Troubleshooting

### Permission Issues

If you see "Permission denied" errors:

```bash
# Fix storage permissions
docker-compose exec app chown -R www-data:www-data storage

# Fix bootstrap cache permissions
docker-compose exec app chown -R www-data:www-data bootstrap/cache
```

### Log File Missing

If `laravel.log` doesn't exist:

```bash
# Ensure logs directory exists
mkdir -p storage/logs

# Set correct permissions
docker-compose exec app chown -R www-data:www-data storage/logs

# Test logging
docker-compose exec app php artisan tinker --execute="Log::info('Test log entry');"
```

### Log File Too Large

For large log files (>100MB):

```bash
# Check file size
ls -lh storage/logs/laravel.log

# Compress old logs
gzip "storage/logs/laravel-$(date +%Y%m%d).log"

# Clear current log
> storage/logs/laravel.log
```

## Monitoring

### Real-time Monitoring

```bash
# Monitor logs continuously
tail -f storage/logs/laravel.log

# Monitor with timestamps
tail -f storage/logs/laravel.log | while read line; do echo "$(date '+%Y-%m-%d %H:%M:%S') $line"; done
```

### Automated Monitoring

Consider setting up log monitoring tools:

- **Logrotate** for automatic rotation
- **Papertrail** or **Loggly** for cloud logging
- **Sentry** or **Bugsnag** for error tracking

## Common Log Messages

### Success Messages

```
[INFO] Email sent successfully {"event_type":"ticket_assigned","recipient":"user@example.com"}
[INFO] Ticket assigned email sent successfully {"ticket_id":123}
[INFO] SendTicketAssignedEmailJob: Completed successfully
```

### Error Messages

```
[ERROR] SQLSTATE[23000]: Integrity constraint violation
[ERROR] Failed to send email: Connection timeout
[ERROR] Permission denied for file upload
```

### Warning Messages

```
[WARNING] Queue worker took longer than expected
[WARNING] High memory usage detected
[WARNING] Rate limit exceeded
```

## Environment-Specific Logging

### Development

- Full debug information
- All log levels visible
- Detailed stack traces

### Production

- Error and above levels only
- Sensitive data masked
- External logging service recommended

## Best Practices

1. **Monitor regularly** - Check logs daily for errors
2. **Set up alerts** - For critical errors and security issues
3. **Rotate logs** - Prevent disk space issues
4. **Backup important logs** - Before clearing or rotating
5. **Use structured logging** - Include context data in log messages
6. **Filter noise** - Use appropriate log levels to avoid log spam

## Log Configuration

Log configuration is in `config/logging.php`:

- Default channel: `single` (writes to `storage/logs/laravel.log`)
- Log level: Configured in `.env` (`LOG_LEVEL=debug`)
- Stack traces: Enabled in development, disabled in production

To change log channel, edit `.env`:

```env
LOG_CHANNEL=daily    # Creates daily log files
LOG_CHANNEL=stack    # Multiple channels (file + stderr)
LOG_CHANNEL=syslog   # System syslog
```

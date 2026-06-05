#!/bin/sh
set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="suqai_${DATE}.sql.gz"
RETENTION_DAYS=${RETENTION_DAYS:-7}

echo "[$(date)] Starting PostgreSQL backup..."

pg_dump \
  "${DATABASE_URL}" \
  --no-owner \
  --no-acl \
  --compress=9 \
  --file="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup saved: ${BACKUP_DIR}/${FILENAME}"

SIZE=$(stat -c%s "${BACKUP_DIR}/${FILENAME}" 2>/dev/null || stat -f%z "${BACKUP_DIR}/${FILENAME}" 2>/dev/null)
echo "[$(date)] Backup size: ${SIZE} bytes"

echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "suqai_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup completed successfully"

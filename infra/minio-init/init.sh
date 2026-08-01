#!/bin/sh
# make bucket + public read
set -e

echo "waiting for minio..."
until mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; do
  sleep 2
done

echo "creating bucket: $MINIO_BUCKET"
mc mb --ignore-existing "local/$MINIO_BUCKET"

echo "allow public download"
mc anonymous set download "local/$MINIO_BUCKET"

echo "minio ready"

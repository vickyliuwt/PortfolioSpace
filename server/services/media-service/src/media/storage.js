// media/storage.js
// one storage api, three drivers
//   minio (default, free local) | s3 (real aws) | local (plain disk)

import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DRIVER = process.env.STORAGE_DRIVER || "minio";
const LOCAL_DIR = path.resolve("uploads");

// keep a key inside the uploads folder, "../" must never escape it
function localPath(key) {
  const full = path.resolve(LOCAL_DIR, String(key || ""));
  if (full !== LOCAL_DIR && !full.startsWith(LOCAL_DIR + path.sep)) {
    throw Object.assign(new Error("bad key"), { statusCode: 400 });
  }
  return full;
}

// s3 clients

function bucket() {
  if (DRIVER === "s3") return process.env.AWS_S3_BUCKET;
  return process.env.MINIO_BUCKET || "portfoliospace";
}

// internal client
function adminClient() {
  if (DRIVER === "s3") {
    return new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  // minio
  return new S3Client({
    region: process.env.MINIO_REGION || "us-east-1",
    endpoint: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
    },
  });
}

// signer client = public address (browser can reach this host)
function signerClient() {
  if (DRIVER === "s3") return adminClient();
  return new S3Client({
    region: process.env.MINIO_REGION || "us-east-1",
    endpoint: process.env.MINIO_PUBLIC_ENDPOINT || "http://127.0.0.1:9000",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
    },
  });
}

// ---- public api ----

// save bytes
export async function putObject(key, buffer, contentType) {
  if (DRIVER === "local") {
    const full = localPath(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return;
  }
  await adminClient().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: buffer, ContentType: contentType })
  );
}

// presigned GET, expiring link. real signing on s3, plain path on the local driver
export async function presignView(key, expiresIn = 3600) {
  if (DRIVER === "local") {
    return `${localBase()}/api/media/files/${key}`;
  }
  return getSignedUrl(signerClient(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}

// presigned PUT (advanced: browser uploads straight to storage)
export async function presignUpload(key, contentType, expiresIn = 900) {
  if (DRIVER === "local") {
    return `${localBase()}/api/media/files/${key}`;
  }
  return getSignedUrl(
    signerClient(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

// plain public url (bucket has public download for covers)
export function publicUrl(key) {
  if (DRIVER === "local") return `${localBase()}/api/media/files/${key}`;
  if (DRIVER === "s3") {
    return `https://${bucket()}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  }
  const base = process.env.MINIO_PUBLIC_ENDPOINT || "http://127.0.0.1:9000";
  return `${base}/${bucket()}/${key}`;
}

// delete
export async function removeObject(key) {
  if (DRIVER === "local") {
    await fs.rm(localPath(key), { force: true });
    return;
  }
  await adminClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

// local driver: read a file (for static serve)
export async function readLocal(key) {
  return fs.readFile(localPath(key));
}

export const driver = DRIVER;

function localBase() {
  return process.env.MEDIA_PUBLIC_URL || `http://localhost:${process.env.PORT || 4003}`;
}

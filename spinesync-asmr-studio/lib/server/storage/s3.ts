import fs from "fs";
import path from "path";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "./types";

export class S3StorageProvider implements StorageProvider {
  driver = "s3" as const;
  private client: S3Client;
  private bucket: string;
  private cloudfrontDomain?: string;

  constructor(options: {
    bucket: string;
    region: string;
    cloudfrontDomain?: string;
  }) {
    this.bucket = options.bucket;
    this.cloudfrontDomain = options.cloudfrontDomain;
    this.client = new S3Client({ region: options.region });
  }

  async putLocalFile(key: string, localPath: string) {
    const body = await fs.promises.readFile(localPath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
      }),
    );
  }

  async getReadableUrl(key: string) {
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${key}`;
    }
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: 3600 });
  }

  async getPresignedUploadUrl(key: string, mime: string, expiresSec = 900) {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mime,
    });
    const url = await getSignedUrl(this.client, cmd, { expiresIn: expiresSec });
    return { url, headers: { "Content-Type": mime } };
  }

  async headObject(key: string) {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { bytes: head.ContentLength ?? 0 };
    } catch {
      return null;
    }
  }

  async downloadToLocal(key: string, destPath: string) {
    const out = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const body = out.Body;
    if (!body) throw new Error("Empty S3 object");
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    const bytes = await body.transformToByteArray();
    await fs.promises.writeFile(destPath, bytes);
  }
}

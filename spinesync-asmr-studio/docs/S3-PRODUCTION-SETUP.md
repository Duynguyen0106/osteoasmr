# S3 bucket for Vercel (Track A)

Minimal IAM setup so uploads, job artifacts, and presigned URLs work on ephemeral hosting.

## Bucket

1. Create a bucket (e.g. `spinesync-asmr-prod`) in your chosen region.
2. Block public access (default). Media is served via presigned URLs or CloudFront (optional).
3. Enable CORS for browser uploads if using presigned PUT from the studio:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["https://spinesync-asmr-studio.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## IAM user (access keys in Vercel)

Attach a policy scoped to the bucket, for example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:HeadObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET"
    }
  ]
}
```

Create access keys and copy them into `.env.vercel.production`, then `npm run vercel:sync-env`.

## Optional CloudFront

Set `AWS_CLOUDFRONT_DOMAIN` to the distribution hostname so export URLs are stable HTTPS links (useful for Ayrshare).

## Verify

After env sync + production redeploy:

```bash
npm run check:production
```

Expect `storage.driver: "s3"`, `ffmpeg: true`, `hosting.pipelineReady: true`.

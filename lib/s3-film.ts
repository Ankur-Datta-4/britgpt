import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BEDROCK_REGION,
  BEDROCK_S3_BUCKET,
  BEDROCK_S3_PREFIX,
} from "@/lib/config";

const getAwsCredentials = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) return null;
  return { accessKeyId, secretAccessKey };
};

const s3Client = () => {
  const creds = getAwsCredentials();
  if (!creds) return null;
  return new S3Client({ region: BEDROCK_REGION, credentials: creds });
};

/** s3://brit-gpt/brit-videos/job-id/ → prefix brit-videos/job-id/ */
export const s3UriToPrefix = (uri: string) => {
  if (!uri?.startsWith("s3://")) return "";
  return uri.replace(/^s3:\/\/[^/]+\//, "").replace(/\/?$/, "/");
};

const findMp4Key = async (client: S3Client, prefix: string) => {
  const base = prefix.replace(/\/?$/, "");
  const candidates = [
    `${base}/output.mp4`,
    `${base}output.mp4`,
    `${BEDROCK_S3_PREFIX}${base.split("/").pop()}/output.mp4`,
  ];

  for (const key of [...new Set(candidates)]) {
    try {
      await client.send(
        new HeadObjectCommand({ Bucket: BEDROCK_S3_BUCKET, Key: key })
      );
      return key;
    } catch {
      /* try next */
    }
  }

  try {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: BEDROCK_S3_BUCKET,
        Prefix: base.endsWith("/") ? base : `${base}/`,
      })
    );
    const mp4 = (list.Contents || [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k && k.endsWith(".mp4"))
      .sort((a, b) => b.localeCompare(a))[0];
    if (mp4) return mp4;
  } catch {
    /* ListBucket may be denied; HeadObject on output.mp4 is enough */
  }

  return null;
};

/** Presigned GET URL for Nova Reel output.mp4 (private bucket). */
export const getFilmPresignedUrl = async (s3Uri: string) => {
  const client = s3Client();
  if (!client) {
    return {
      ok: false as const,
      error: "Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local",
    };
  }

  let prefix = s3UriToPrefix(s3Uri);
  if (!prefix) prefix = BEDROCK_S3_PREFIX;

  const key = await findMp4Key(client, prefix);
  if (!key) {
    return {
      ok: false as const,
      error: "output.mp4 not found yet — wait for Nova Reel to finish",
      prefix,
    };
  }

  const playUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BEDROCK_S3_BUCKET, Key: key }),
    { expiresIn: 3600 }
  );

  return { ok: true as const, playUrl, key, bucket: BEDROCK_S3_BUCKET };
};

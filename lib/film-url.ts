/** Resolve private S3 Nova Reel output to a presigned play URL. */
export const resolveFilmPlaybackUrl = async (s3Uri: string) => {
  const res = await fetch(`/api/film?uri=${encodeURIComponent(s3Uri)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not sign film URL");
  }
  return data.playUrl as string;
};

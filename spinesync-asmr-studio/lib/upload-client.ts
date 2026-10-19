export async function uploadAssetSmart(file: File): Promise<string> {
  const health = await fetch("/api/health");
  const info = (await health.json()) as {
    storage?: { driver?: string; presign?: boolean };
  };

  if (info.storage?.driver === "s3" && info.storage?.presign) {
    const presignRes = await fetch("/api/assets/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        mime: file.type || "video/mp4",
        bytes: file.size,
      }),
    });
    if (!presignRes.ok) {
      throw new Error("Presign failed");
    }
    const presign = (await presignRes.json()) as {
      assetId: string;
      uploadUrl: string;
      headers?: Record<string, string>;
    };

    const put = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: presign.headers ?? { "Content-Type": file.type || "video/mp4" },
      body: file,
    });
    if (!put.ok) throw new Error("S3 upload failed");

    const complete = await fetch("/api/assets/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: presign.assetId }),
    });
    if (!complete.ok) throw new Error("Asset complete failed");
    return presign.assetId;
  }

  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/assets/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Upload failed");
  }
  const data = (await res.json()) as { assetId: string };
  return data.assetId;
}

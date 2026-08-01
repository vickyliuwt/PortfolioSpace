// upload.ts
// blob upload

import api from "./api";

export async function uploadMedia(file: Blob, name: string): Promise<{ url: string; key: string; type: string }> {
  const form = new FormData();
  form.append("file", file, name);
  const res = await api.post("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { url: res.data.url, key: res.data.key, type: res.data.type };
}

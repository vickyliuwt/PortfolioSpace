"use client";

// UploadWidget.tsx
// file upload
// shared shape

import { useState, useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";
import api from "../lib/api";
import type { MediaItem } from "../lib/types";

export default function UploadWidget({
  label = "Upload file",
  accept = "image/*,video/*",
  onUploaded,
}: {
  label?: string;
  accept?: string;
  onUploaded: (m: MediaItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setErr("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/media/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // { key, url, viewUrl, type }
      onUploaded({
        key: res.data.key,
        url: res.data.url,
        type: res.data.type,
        caption: "",
      });
    } catch (e2: unknown) {
      const msg =
        (e2 as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "upload failed, try a smaller file";
      setErr(msg);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <button type="button" className="btn btn-ghost" onClick={pick} disabled={busy}>
        <FiUploadCloud /> {busy ? "uploading…" : label}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} />
      {err && (
        <div className="error-box" style={{ marginTop: 8 }}>
          {err}
        </div>
      )}
    </div>
  );
}

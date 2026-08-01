"use client";

// VoiceRecorder.tsx
// mic record

import { useEffect, useRef, useState } from "react";
import { FiMic, FiSquare } from "react-icons/fi";
import { uploadMedia } from "../lib/upload";

export default function VoiceRecorder({ onRecorded }: { onRecorded: (url: string, key: string, secs: number) => void }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState("");

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef = useRef(0);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => cleanup, []);

  const start = async () => {
    setErr("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      setErr("not supported here");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const mime = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        cleanup();
        setRecording(false);
        if (!blob.size) return;
        setBusy(true);
        try {
          const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "mp4" : "webm";
          const { url, key } = await uploadMedia(blob, `voice-${Date.now()}.${ext}`);
          const dur = Math.max(1, Math.round((Date.now() - startTsRef.current) / 1000));
          onRecorded(url, key, dur);
        } catch {
          setErr("send failed");
        } finally {
          setBusy(false);
        }
      };
      rec.start();
      recRef.current = rec;
      startTsRef.current = Date.now();
      setSecs(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      setErr("mic needed");
      cleanup();
    }
  };

  const stop = () => recRef.current?.stop();

  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {recording ? (
        <button type="button" className="btn btn-danger btn-sm" onClick={stop} aria-label="Stop recording">
          <FiSquare /> {mmss}
        </button>
      ) : (
        <button type="button" className="btn btn-cream btn-sm" onClick={start} disabled={busy} aria-label="Record voice">
          <FiMic /> {busy ? "sending…" : "Voice"}
        </button>
      )}
      {err && (
        <span style={{ fontSize: "0.72rem", color: "var(--rose)", fontWeight: 700 }}>{err}</span>
      )}
    </span>
  );
}

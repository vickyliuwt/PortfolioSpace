// lib/img.ts
// dead url fallbacks

import type { SyntheticEvent } from "react";

export const FALLBACK_COVER = "/covers/cover-default.svg";
export const FALLBACK_AVATAR = "/mascot/avatar-default.svg";

// swap once, a second miss would loop
function swap(e: SyntheticEvent<HTMLImageElement>, to: string) {
  const el = e.currentTarget;
  if (el.dataset.swapped) return;
  el.dataset.swapped = "1";
  el.src = to;
}

// broken cover
export function onCoverError(e: SyntheticEvent<HTMLImageElement>) {
  swap(e, FALLBACK_COVER);
}

// broken avatar
export function onAvatarError(e: SyntheticEvent<HTMLImageElement>) {
  swap(e, FALLBACK_AVATAR);
}

"use client";

/* eslint-disable @next/next/no-img-element */
import type { User } from "@supabase/supabase-js";
import { avatarUrl, displayName } from "./AuthProvider";

export function UserAvatar({ user, size = 36 }: { user: User; size?: number }) {
  const url = avatarUrl(user);
  const name = displayName(user);
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return url ? (
    <img src={url} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full border-2 border-ink object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full border-2 border-ink bg-sun-300 text-sm font-extrabold" style={{ width: size, height: size }}>
      {initials || "?"}
    </span>
  );
}

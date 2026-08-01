"use client";

// NavBar.tsx
// top nav

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiCompass, FiFolder, FiPlusCircle, FiLogOut, FiBookmark, FiRss, FiGrid, FiBell, FiMail, FiShield, FiFilm, FiSearch } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCurrentUser } from "../store/accountReducer";
import { setFollowing, clearFollowing } from "../store/followReducer";
import { signout, unreadCount, messagesUnread, followingIds } from "../(portfolio)/Account/client";
import { onAvatarError } from "../lib/img";

export default function NavBar() {
  const user = useAppSelector((s) => s.account.currentUser);
  const followLoaded = useAppSelector((s) => s.follow.loaded);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);

  // poll unread notifications + messages while logged in (responsive: refresh on focus)
  useEffect(() => {
    if (!user) {
      setUnread(0);
      setMsgUnread(0);
      return;
    }
    let alive = true;
    const tick = () => {
      unreadCount().then((n) => alive && setUnread(n)).catch(() => {});
      messagesUnread().then((n) => alive && setMsgUnread(n)).catch(() => {});
    };
    tick();
    const t = setInterval(tick, 12000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user, path]);

  // load who i follow once (so project cards can show Follow / Following)
  useEffect(() => {
    if (!user) {
      dispatch(clearFollowing());
      return;
    }
    if (!followLoaded) {
      followingIds()
        .then((ids) => dispatch(setFollowing(ids)))
        .catch(() => {});
    }
  }, [user, followLoaded, dispatch]);

  // sign out then home
  const doSignout = async () => {
    await signout();
    dispatch(setCurrentUser(null));
    dispatch(clearFollowing());
    router.push("/");
  };

  // active tab
  const on = (href: string) => path === href || (href !== "/" && path.startsWith(href));

  return (
    <nav className="nav" aria-label="Main">
      <Link href="/" className="nav-brand" aria-label="PortfolioSpace home">
        <span className="paw" aria-hidden="true">🐾</span>
        <span className="txt">
          Portfolio<b>Space</b>
        </span>
      </Link>

      <span className="nav-divide" aria-hidden="true" />

      <Link href="/Reels" className={"nav-btn" + (on("/Reels") ? " active" : "")}>
        <FiFilm aria-hidden="true" />
        <span className="lbl">Reels</span>
      </Link>

      <Link href="/Search" className={"nav-btn" + (on("/Search") ? " active" : "")}>
        <FiSearch aria-hidden="true" />
        <span className="lbl">Search</span>
      </Link>

      <Link href="/Discover" className={"nav-btn" + (on("/Discover") ? " active" : "")}>
        <FiCompass aria-hidden="true" />
        <span className="lbl">Discover</span>
      </Link>

      {user && (
        <Link href="/Projects" className={"nav-btn" + (on("/Projects") ? " active" : "")}>
          <FiFolder aria-hidden="true" />
          <span className="lbl">My Work</span>
        </Link>
      )}

      {user && (
        <Link href="/Feed" className={"nav-btn" + (on("/Feed") ? " active" : "")}>
          <FiRss aria-hidden="true" />
          <span className="lbl">Feed</span>
        </Link>
      )}

      {user && user.role === "ADMIN" && (
        <Link href="/Admin" className={"nav-btn" + (on("/Admin") ? " active" : "")}>
          <FiShield aria-hidden="true" />
          <span className="lbl">Admin</span>
        </Link>
      )}

      {user && (
        <Link href="/Saved" className={"nav-btn" + (on("/Saved") ? " active" : "")}>
          <FiBookmark aria-hidden="true" />
          <span className="lbl">Saved</span>
        </Link>
      )}

      {user && (
        <Link href="/Collections" className={"nav-btn" + (on("/Collections") ? " active" : "")}>
          <FiGrid aria-hidden="true" />
          <span className="lbl">Collections</span>
        </Link>
      )}

      <span className="nav-divide" aria-hidden="true" />

      {user ? (
        <>
          <Link href="/Projects/New" className="nav-btn" aria-label="New project">
            <FiPlusCircle aria-hidden="true" />
            <span className="lbl">New</span>
          </Link>
          <Link href="/Notifications" className={"nav-btn" + (on("/Notifications") ? " active" : "")} aria-label="Notifications" style={{ position: "relative" }}>
            <FiBell aria-hidden="true" />
            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  background: "var(--rose)",
                  color: "#fff",
                  borderRadius: 10,
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  minWidth: 15,
                  height: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link href="/Messages" className={"nav-btn" + (on("/Messages") ? " active" : "")} aria-label="Messages" style={{ position: "relative" }}>
            <FiMail aria-hidden="true" />
            {msgUnread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  background: "var(--rose)",
                  color: "#fff",
                  borderRadius: 10,
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  minWidth: 15,
                  height: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                }}
              >
                {msgUnread > 9 ? "9+" : msgUnread}
              </span>
            )}
          </Link>
          <Link href="/Account/Profile" className={"nav-btn" + (on("/Account") ? " active" : "")} aria-label="Profile" title={user.displayName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nav-avatar" src={user.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={user.displayName || user.username} />
          </Link>
          <button className="nav-btn" onClick={doSignout} aria-label="Sign out">
            <FiLogOut aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          <Link href="/Account/Signin" className="nav-btn">
            <span>Sign in</span>
          </Link>
          <Link href="/Account/Signup" className="btn btn-pink btn-sm" style={{ marginLeft: 2 }}>
            Sign up
          </Link>
        </>
      )}
    </nav>
  );
}

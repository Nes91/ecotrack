import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { menuByRole } from "../utils/menuConfig";

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const menu = menuByRole[user.role] || [];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav style={styles.nav(scrolled)}>
      {/* Animated top accent line */}
      <div style={styles.accentLine} />

      <div style={styles.container}>
        {/* Logo */}
        <Link to="/dashboard" style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" fill="url(#leafGrad)" opacity="0.15" />
              <path d="M14 4C14 4 22 10 22 17c0 4.4-3.6 8-8 8s-8-3.6-8-8c0-7 8-13 8-13z" fill="url(#leafGrad)" />
              <path d="M14 10v8M11 14l3-3 3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="leafGrad" x1="6" y1="4" x2="22" y2="24">
                  <stop stopColor="#22c55e" />
                  <stop offset="1" stopColor="#16a34a" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span style={styles.logoText}>Eco<span style={styles.logoAccent}>Track</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-desktop-menu" style={styles.desktopMenu}>
          {menu.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={styles.navLink(isActive)}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#16a34a";
                    e.currentTarget.querySelector(".link-bg").style.transform = "scaleX(1)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#4b5563";
                    e.currentTarget.querySelector(".link-bg").style.transform = "scaleX(0)";
                  }
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                <span className="link-bg" style={styles.linkBg(isActive)} />
              </Link>
            );
          })}
        </div>

        {/* Desktop User + Logout */}
        <div className="navbar-desktop-right" style={styles.desktopRight}>
          <Link to="/profile" style={{ textDecoration: "none", cursor: "pointer" }}>
            <div
              style={styles.userCard}
              onMouseEnter={e => { e.currentTarget.style.border = "1px solid #86efac"; e.currentTarget.style.background = "#e8f5e9"; }}
              onMouseLeave={e => { e.currentTarget.style.border = "1px solid #e2f0e6"; e.currentTarget.style.background = "#f3faf5"; }}
            >
              <div style={styles.avatarCircle}>
                <span style={styles.avatarText}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div style={styles.userInfo}>
                <p style={styles.userName}>{user.firstName} {user.lastName}</p>
                <p style={styles.userRole}>{user.role}</p>
              </div>
            </div>
          </Link>
          <button
            onClick={onLogout}
            style={styles.logoutBtn}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, #dc2626, #b91c1c)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(239,68,68,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="navbar-hamburger"
          style={styles.hamburger}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <span style={styles.hamburgerLine(open, 1)} />
          <span style={styles.hamburgerLine(open, 2)} />
          <span style={styles.hamburgerLine(open, 3)} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}

      {/* Mobile Menu Panel */}
      <div style={styles.mobilePanel(open)}>
        <div style={styles.mobilePanelInner}>
          {/* Mobile User Header → clique vers Profil */}
          <Link to="/profile" onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
            <div style={styles.mobileUserHeader}>
              <div style={styles.mobileAvatarCircle}>
                <span style={styles.mobileAvatarText}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div>
                <p style={styles.mobileUserName}>{user.firstName} {user.lastName}</p>
                <p style={styles.mobileUserRole}>{user.role}</p>
              </div>
            </div>
          </Link>

          {/* Mobile Links */}
          <nav style={styles.mobileNav}>
            {menu.map((item, i) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  style={styles.mobileLink(isActive)}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = "rgba(34,197,94,0.06)";
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {isActive && <span style={styles.mobileActiveDot} />}
                  <span style={styles.mobileNavIcon(isActive)}>{item.icon}</span>
                  <span style={styles.mobileNavLabel(isActive)}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Logout */}
          <button
            onClick={onLogout}
            style={styles.mobileLogoutBtn}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, #dc2626, #b91c1c)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
  nav: (scrolled) => ({
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: scrolled
      ? "rgba(255,255,255,0.92)"
      : "rgba(255,255,255,0.97)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: scrolled
      ? "0 2px 24px rgba(34,197,94,0.08), 0 1px 3px rgba(0,0,0,0.06)"
      : "0 1px 4px rgba(0,0,0,0.04)",
    transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
  }),

  accentLine: {
    height: "3px",
    background: "linear-gradient(90deg, #22c55e 0%, #16a34a 40%, #86efac 70%, #22c55e 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 3s linear infinite",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },

  // ── Logo
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    flexShrink: 0,
  },
  logoIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1f2937",
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "-0.5px",
  },
  logoAccent: {
    color: "#16a34a",
  },

  // ── Desktop Menu  (display toggled via .navbar-desktop-menu in App.css)
 desktopMenu: {
  display: "flex",   // ✅
  alignItems: "center",
  gap: "4px",
},
  navLink: (isActive) => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: isActive ? "600" : "500",
    color: isActive ? "#16a34a" : "#4b5563",
    background: isActive ? "rgba(34,197,94,0.08)" : "transparent",
    transition: "all 0.25s ease",
    whiteSpace: "nowrap",
    zIndex: 1,
  }),
  navIcon: {
    fontSize: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
  },
  linkBg: (isActive) => ({
    position: "absolute",
    bottom: "4px",
    left: "14px",
    right: "14px",
    height: "2px",
    borderRadius: "2px",
    background: "linear-gradient(90deg, #22c55e, #16a34a)",
    transform: isActive ? "scaleX(1)" : "scaleX(0)",
    transformOrigin: "center",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
  }),

  // ── Desktop Right (user + logout) — display toggled via .navbar-desktop-right in App.css
desktopRight: {
  display: "flex",   // ✅
  alignItems: "center",
  gap: "16px",
  marginLeft: "auto",
  flexShrink: 0,
},
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 12px 6px 6px",
    borderRadius: "12px",
    background: "#f3faf5",
    border: "1px solid #e2f0e6",
  },
  avatarCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(34,197,94,0.35)",
  },
  avatarText: {
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  userInfo: {
    textAlign: "left",
  },
  userName: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: "1.3",
  },
  userRole: {
    margin: 0,
    fontSize: "11px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    fontWeight: "500",
  },

  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },

  // ── Hamburger  (display toggled via .navbar-hamburger in App.css)
 hamburger: {
  display: "flex",   // ✅
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
    gap: "5px",
    width: "40px",
    height: "40px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    borderRadius: "10px",
    padding: "8px",
    transition: "background 0.2s",
  },
  hamburgerLine: (open, index) => ({
    width: "22px",
    height: "2.5px",
    borderRadius: "2px",
    background: "#374151",
    transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
    transform:
      open && index === 1 ? "rotate(45deg) translate(5px, 5px)" :
      open && index === 3 ? "rotate(-45deg) translate(5px, -5px)" :
      "none",
    opacity: open && index === 2 ? 0 : 1,
  }),

  // ── Mobile Overlay
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(2px)",
    zIndex: 999,
    top: "67px",
  },

  // ── Mobile Panel
  mobilePanel: (open) => ({
    position: "fixed",
    top: "67px",
    left: 0,
    right: 0,
    zIndex: 1000,
    background: "#fff",
    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
    borderRadius: "0 0 20px 20px",
    overflow: "hidden",
    maxHeight: open ? "600px" : "0px",
    opacity: open ? 1 : 0,
    transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
  }),
  mobilePanelInner: {
    padding: "20px 20px 24px",
  },

  // Mobile user header
  mobileUserHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    borderRadius: "14px",
    marginBottom: "16px",
    border: "1px solid #bbf7d0",
  },
  mobileAvatarCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 3px 10px rgba(34,197,94,0.4)",
    flexShrink: 0,
  },
  mobileAvatarText: {
    color: "#fff",
    fontSize: "17px",
    fontWeight: "700",
  },
  mobileUserName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#1f2937",
  },
  mobileUserRole: {
    margin: 0,
    fontSize: "12px",
    color: "#16a34a",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  // Mobile nav links
  mobileNav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  mobileLink: (isActive) => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "13px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    background: isActive ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))" : "transparent",
    border: isActive ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
    transition: "all 0.2s ease",
  }),
  mobileActiveDot: {
    position: "absolute",
    left: "8px",
    width: "3px",
    height: "24px",
    borderRadius: "3px",
    background: "linear-gradient(180deg, #22c55e, #16a34a)",
  },
  mobileNavIcon: (isActive) => ({
    fontSize: "20px",
    width: "26px",
    textAlign: "center",
    filter: isActive ? "drop-shadow(0 0 4px rgba(34,197,94,0.4))" : "none",
  }),
  mobileNavLabel: (isActive) => ({
    fontSize: "15px",
    fontWeight: isActive ? "600" : "500",
    color: isActive ? "#16a34a" : "#374151",
  }),

  // Mobile logout
  mobileLogoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    marginTop: "20px",
    padding: "13px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 3px 12px rgba(239,68,68,0.35)",
    transition: "all 0.2s ease",
  },
};
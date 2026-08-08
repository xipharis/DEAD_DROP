"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/sign", label: "Sign" },
  { href: "/docs", label: "Docs" },
];

/** The dead-drop mark: a note left in a hollow, picked up by someone else. */
export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5 group">
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="4" fill="rgba(200,16,46,0.10)" />
        <path
          d="M6 11 L16 18 L26 11"
          stroke="#C8102E"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="6" y="9" width="20" height="15" rx="2" stroke="#C8102E" strokeWidth="2" />
        <circle cx="16" cy="26" r="2" fill="#2B1D14" />
      </svg>
      <span className="font-display font-extrabold text-sm tracking-wider text-[#231812] group-hover:text-[#C8102E] transition-colors duration-200">
        DEAD<span className="text-[#C8102E]">DROP</span>
      </span>
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md bg-[rgba(250,244,232,0.88)] border-[rgba(62,44,30,0.16)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        <Link href="/" aria-label="Dead Drop home">
          <Wordmark />
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-xs font-display tracking-wider uppercase transition-colors duration-200 rounded ${
                  isActive
                    ? "text-[#C8102E]"
                    : "text-[rgba(35,24,18,0.62)] hover:text-[#231812]"
                }`}
              >
                <motion.span
                  className="block"
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {link.label}
                </motion.span>
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0.5 left-3 right-3 h-[1.5px] rounded-full bg-[#C8102E]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

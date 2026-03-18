"use client";

export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head shape */}
      <path d="M18 4C10 4 5 10 5 18C5 24 9 30 18 32C27 30 31 24 31 18C31 10 26 4 18 4Z" fill="#7c3aed" />
      {/* Beak */}
      <path d="M18 20L14 24L18 28L22 24Z" fill="#f59e0b" />
      <path d="M18 20L18 28" stroke="#d97706" strokeWidth="0.5" />
      {/* Eyes */}
      <circle cx="12" cy="15" r="4" fill="#1e1b4b" />
      <circle cx="24" cy="15" r="4" fill="#1e1b4b" />
      <circle cx="12.5" cy="14.5" r="2.2" fill="#ede9fe" />
      <circle cx="24.5" cy="14.5" r="2.2" fill="#ede9fe" />
      <circle cx="12" cy="14" r="1.2" fill="#1e1b4b" />
      <circle cx="24" cy="14" r="1.2" fill="#1e1b4b" />
      <circle cx="12.4" cy="13.5" r="0.5" fill="white" />
      <circle cx="24.4" cy="13.5" r="0.5" fill="white" />
      {/* Forehead feather tuft */}
      <path d="M18 4C17 1 15 0 14 1" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 4C18 1 18 -1 17 -1" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 4C19 1 21 0 22 1" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
      {/* Cheek highlight */}
      <circle cx="9" cy="20" r="2" fill="#8b5cf6" opacity="0.4" />
      <circle cx="27" cy="20" r="2" fill="#8b5cf6" opacity="0.4" />
    </svg>
  );
}

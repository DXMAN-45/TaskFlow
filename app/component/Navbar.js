
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { name: "Home", href: "/dashboard" },
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/#pricing" },
  { name: "Contact", href: "/#contact" },
];

const Navbar = () => {
  const [menuDisplay, setMenuDisplay] = useState(false);
  const router = useRouter();

  const closeMenu = () => setMenuDisplay(false);

  const handleGetStarted = () => {
    closeMenu();
    router.push("/dashboard");
  };

  return (
    <header className="absolute top-0 left-0 z-50 w-full px-3 pt-4 sm:px-6 sm:pt-5 lg:px-10">
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-6 lg:px-8"
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="TaskFlow home"
        >
          <Image
            src="/icon.png"
            alt="TaskFlow logo"
            width={44}
            height={44}
            priority
            className="h-9 w-9 object-contain sm:h-11 sm:w-11"
          />

          <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Task<span className="text-blue-600">Flow</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[15px] font-semibold text-slate-600 transition-colors duration-200 hover:text-blue-600"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <button
          type="button"
          onClick={handleGetStarted}
          className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 lg:flex"
        >
          Get Started - Free
          <ArrowRight size={16} />
        </button>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuDisplay((prev) => !prev)}
          aria-label={menuDisplay ? "Close menu" : "Open menu"}
          aria-expanded={menuDisplay}
          aria-controls="mobile-navigation"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-95 lg:hidden"
        >
          {menuDisplay ? (
            <X size={23} />
          ) : (
            <Menu size={23} />
          )}
        </button>

        {/* Mobile Dropdown */}
        <div
          id="mobile-navigation"
          className={`absolute left-0 right-0 top-[calc(100%+10px)] origin-top rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl shadow-slate-900/10 transition-all duration-200 lg:hidden ${
            menuDisplay
              ? "visible translate-y-0 scale-100 opacity-100"
              : "invisible -translate-y-2 scale-[0.98] opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98]"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="my-3 border-t border-slate-100" />

          <button
            type="button"
            onClick={handleGetStarted}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3.5 text-base font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg active:scale-[0.98]"
          >
            Get Started - Free
            <ArrowRight size={18} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

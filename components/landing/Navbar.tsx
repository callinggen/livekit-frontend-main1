"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, PhoneCall, Moon, Sun, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageContext";
import { Language, languageNames } from "@/lib/translations";

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navLinks = [
    { name: t("navPricing"), href: "/pricing" },
    { name: t("navContact"), href: "/contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 px-4`}
      >
        <div
          className={`mx-auto max-w-[1000px] transition-all duration-300 rounded-full ${
            isScrolled
              ? "bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800 py-3 px-5"
              : "bg-white/60 dark:bg-[#0B0F19]/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 py-4 px-6 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
          {/* Logo - Redirects to /dashboard if logged in, otherwise / */}
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <div className="bg-[#4F6BFF] p-2 rounded-xl text-white shadow-md shadow-[#4F6BFF]/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              CallingGen
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#4F6BFF] dark:hover:text-[#4F6BFF] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:border-[#4F6BFF] transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-[#4F6BFF]" />
                <span>{languageNames[language].flag} {languageNames[language].nativeName}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showLangDropdown ? "rotate-180" : ""}`} />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] py-1.5 shadow-xl z-50">
                  {(["en", "te", "hi"] as Language[]).map((langKey) => (
                    <button
                      key={langKey}
                      type="button"
                      onClick={() => {
                        setLanguage(langKey);
                        setShowLangDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-xs font-semibold transition-colors ${
                        language === langKey
                          ? "bg-indigo-50 text-[#4F6BFF] dark:bg-indigo-950/40 dark:text-[#818CF8]"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{languageNames[langKey].flag} {languageNames[langKey].nativeName}</span>
                      {language === langKey && <span className="text-xs font-bold text-[#4F6BFF]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-[#4F6BFF] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Login / Dashboard Link */}
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="text-sm font-semibold text-slate-800 dark:text-white hover:text-[#4F6BFF] transition-colors px-1"
            >
              {isLoggedIn ? t("navDashboard") : t("navLogin")}
            </Link>

            {/* Get Call Button */}
            <button onClick={() => window.dispatchEvent(new Event("open-get-call-modal"))} className="hidden lg:block group">
              <div className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4F6BFF] text-white rounded-full font-semibold text-sm transition-all shadow-[0_0_0_2px_rgba(79,107,255,0.2)] hover:shadow-[0_0_0_4px_rgba(79,107,255,0.3)] hover:-translate-y-0.5">
                {t("getCall")}
              </div>
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-800 dark:text-white"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              className="p-2 text-slate-800 dark:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-[#111827] shadow-xl border-t border-slate-200 dark:border-slate-800 py-5 px-6 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-base font-semibold text-slate-800 dark:text-white py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="text-center w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {isLoggedIn ? "Dashboard" : "Login"}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
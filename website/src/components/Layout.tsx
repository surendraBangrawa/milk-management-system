"use client";
import {
  ColorPalette,
  darkColors,
  lightColors,
  ThemeContext,
} from "@/context/ThemeContext";
import Link from "next/link";
import React, { ReactNode, useEffect, useState } from "react";

interface LayoutProps {
  children: ReactNode;
}
const Layout = ({ children }: LayoutProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const colors: ColorPalette = theme === "light" ? lightColors : darkColors;

  return (
    <>
      <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
        <nav
          className="py-4 px-6 md:px-12 flex justify-between items-center"
          style={{
            backgroundColor: colors.surface,
            boxShadow: `0 2px 8px ${colors.shadow}`,
          }}
        >
          <Link href="/" passHref>
            <div
              className="text-2xl font-bold cursor-pointer"
              style={{ color: colors.primary }}
            >
              DigiDairy
            </div>
          </Link>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-full font-semibold transition-all duration-300 transform active:scale-95"
            style={{
              backgroundColor: colors.primary,
              color: colors.surface,
              boxShadow: `0 4px 6px -1px ${colors.shadow}`,
            }}
          >
            {theme === "light" ? (
              <>
                <span role="img" aria-label="Dark mode">
                  🌙
                </span>{" "}
                Dark Mode
              </>
            ) : (
              <>
                <span role="img" aria-label="Light mode">
                  ☀️
                </span>{" "}
                Light Mode
              </>
            )}
          </button>
        </nav>
        <main className="flex-grow bg-gray-50">{children}</main>
        <footer
          className="py-12 px-6 md:px-12 mt-auto"
          style={{
            backgroundColor: colors.surface,
            color: colors.textSecondary,
            boxShadow: `0 -2px 8px ${colors.shadow}`,
          }}
        >
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 text-center md:text-left">
            {/* Section 1: Brand Info */}
            <div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: colors.primary }}
              >
                DigiDairy
              </h3>
              <p className="text-sm mb-2">
                Revolutionizing dairy farming with digital solutions.
              </p>
              <p className="text-sm">
                Based in Sri Ganganagar, Rajasthan, India
              </p>
              <p className="text-sm">
                © {new Date().getFullYear()} DigiDairy. All rights reserved.
              </p>
            </div>

            {/* Section 2: Quick Links */}
            <div>
              <h4
                className="text-lg font-semibold mb-4"
                style={{ color: colors.textPrimary }}
              >
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Section 3: Legal & Help */}
            <div>
              <h4
                className="text-lg font-semibold mb-4"
                style={{ color: colors.textPrimary }}
              >
                Legal & Help
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="hover:underline"
                    style={{ color: colors.textSecondary }}
                  >
                    Help & FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Section 4: Download Our App */}
            <div>
              <h4
                className="text-lg font-semibold mb-4"
                style={{ color: colors.textPrimary }}
              >
                Download Our App
              </h4>
              <div className="flex flex-col items-center md:items-start space-y-4">
                <a
                  href="https://play.google.com/store/apps/details?id=your.app.package" // Replace with actual Play Store link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.surface,
                  }}
                >
                  {/* Google Play Icon (simplified SVG) */}
                  <svg
                    className="w-6 h-6 mr-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M21.566 11.23l-3.95-2.28-7.85 4.54-3.95-2.28L6 13.91l6.39 3.69 8.27-4.78c.03-.02.05-.05.07-.07.03-.03.05-.07.07-.1v-.01c.02-.03.03-.07.04-.1.01-.03.02-.06.02-.1h.01V12a.987.987 0 000-.18.987.987 0 000-.18l-.01-.02c-.01-.03-.02-.06-.04-.1zM6.44 3.95c-.32-.18-.72-.25-1.12-.18C4.54 3.84 4 4.31 4 5V19c0 .69.54 1.16 1.32 1.05.4-.07.8-.14 1.12-.18l12.43-7.18L6.44 3.95z" />
                  </svg>
                  Download on Play Store
                </a>
                <a
                  href="https://apps.apple.com/us/app/your-app-id/id1234567890" // Replace with actual Apple App Store link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.surface,
                  }}
                >
                  {/* Apple App Store Icon (simplified SVG) */}
                  <svg
                    className="w-6 h-6 mr-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C8.6 0 7.04 2.5 7.04 4.56c0 1.63.85 3.33 2.1 4.7l.14.15c.61.64.91 1.25.91 1.96 0 1.25-.91 1.96-1.57 2.21-.66.25-1.07.25-1.42 0-.35-.25-.49-.78-.49-1.25 0-.61.18-1.25.49-1.96.14-.3.28-.61.35-.91.07-.14.11-.25.11-.35 0-.11-.04-.21-.07-.35-.04-.07-.07-.11-.11-.14-.35-.28-.7-.49-1.07-.61-.7-.25-1.57-.25-2.21 0-.61.25-1.07.78-1.42 1.42-.35.61-.49 1.42-.49 2.21 0 1.25.7 2.44 1.57 3.33.85.91 1.76 1.57 2.86 1.96.91.35 1.96.49 3.07.49 1.42 0 2.86-.35 4.08-1.07 1.25-.7 2.21-1.76 2.86-3.07.61-1.25.91-2.6.91-4.08 0-1.42-.35-2.86-1.07-4.08-.7-1.25-1.76-2.21-3.07-2.86C14.86.35 13.42 0 12 0z" />
                  </svg>
                  Download on App Store
                </a>
              </div>
            </div>
          </div>
        </footer>
      </ThemeContext.Provider>
    </>
  );
};

export default Layout;

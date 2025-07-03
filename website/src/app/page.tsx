"use client";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

export default function LandingPage() {
  const { theme, colors } = useTheme();

  return (
    <div
      className="min-h-screen font-inter transition-colors duration-300 flex flex-col"
      style={{ backgroundColor: colors.background, color: colors.textPrimary }}
    >
      {/* Hero Section */}
      <header className="py-20 text-center flex flex-col items-center justify-center min-h-[calc(100vh-140px)] flex-grow px-4">
        <h1
          className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight"
          style={{ color: colors.textPrimary }}
        >
          Revolutionize Your <br className="hidden sm:inline" />
          <span style={{ color: colors.primary }}>Dairy Farm</span>
        </h1>
        <p
          className="text-lg md:text-xl max-w-2xl mb-8"
          style={{ color: colors.textSecondary }}
        >
          DigiDairy provides cutting-edge digital solutions to optimize your
          dairy operations, from herd management to milk production.
        </p>
        {/* <Link href="/signup" passHref>
          <button
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 5px 15px ${colors.shadow}`,
              backgroundImage:
                theme === "light"
                  ? `linear-gradient(to right, ${colors.primaryLight}, ${colors.primaryDark})` // Use colors from context
                  : `linear-gradient(to right, ${colors.primaryLight}, ${colors.primaryDark})`, // Use colors from context
            }}
          >
            Get Started Today
          </button>
        </Link> */}
      </header>

      {/* Features Section */}
      <section
        className="py-16 px-6 md:px-12"
        style={{ backgroundColor: colors.background }}
      >
        <h2
          className="text-4xl font-bold text-center mb-12"
          style={{ color: colors.textPrimary }}
        >
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature Card 1 */}
          <div
            className="p-6 rounded-lg transition-all duration-300 flex flex-col items-center text-center"
            style={{
              backgroundColor: colors.surface,
              boxShadow: `0 4px 12px ${colors.shadow}`,
              border: `1px solid ${colors.border}`,
            }}
          >
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke={colors.primary}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h-2V10h-4v10H7v-3H5v3a2 2 0 002 2h10a2 2 0 002-2v-3h-2v3zM10 9V7h4v2"
              ></path>
            </svg>
            <h3
              className="text-2xl font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Smart Herd Monitoring
            </h3>
            <p style={{ color: colors.textSecondary }}>
              Track individual animal health, feeding, and milk production with
              real-time data.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div
            className="p-6 rounded-lg transition-all duration-300 flex flex-col items-center text-center"
            style={{
              backgroundColor: colors.surface,
              boxShadow: `0 4px 12px ${colors.shadow}`,
              border: `1px solid ${colors.border}`,
            }}
          >
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke={colors.primary}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 6l3 1m0 0l-3 9a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 6H9"
              />
            </svg>
            <h3
              className="text-2xl font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Automated Milk Records
            </h3>
            <p style={{ color: colors.textSecondary }}>
              Seamlessly record and analyze milk yield, quality, and trends for
              better decision-making.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div
            className="p-6 rounded-lg transition-all duration-300 flex flex-col items-center text-center"
            style={{
              backgroundColor: colors.surface,
              boxShadow: `0 4px 12px ${colors.shadow}`,
              border: `1px solid ${colors.border}`,
            }}
          >
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke={colors.primary}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
            <h3
              className="text-2xl font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Financial Insights
            </h3>
            <p style={{ color: colors.textSecondary }}>
              Gain clear visibility into your farms profitability with
              integrated financial tools.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

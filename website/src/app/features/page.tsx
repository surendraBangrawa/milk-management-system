"use client";
import React from "react";
import { useTheme } from "@/context/ThemeContext"; // Import ThemeContext

const FEATURES_DATA = [
  {
    icon: "📊", // You can replace with actual SVG icons later
    title: "Automated Milk Pricing",
    description:
      "Say goodbye to manual calculations! Upload your milk rate lists (fat, SNF based) and DigiDairy automatically calculates milk prices for every transaction, saving you time and reducing errors.",
  },
  {
    icon: "💰",
    title: "Comprehensive Expense & Income Tracking",
    description:
      "Effortlessly record all your daily dairy expenses and income. Categorize transactions, add notes, and maintain a clear ledger of your financial ins and outs.",
  },
  {
    icon: "📈",
    title: "Detailed Financial Reports",
    description:
      "Gain insights into your dairy business with robust reporting. Generate daily, weekly, and monthly summaries, expense reports, income statements, and customer/supplier ledgers with ease.",
  },
  {
    icon: "🤝",
    title: "Flexible Role Management (Customer & Supplier)",
    description:
      "Whether you're buying milk or selling it, DigiDairy adapts to your role. Manage transactions from both perspectives within a single, intuitive interface.",
  },
  {
    icon: "⏰",
    title: "Smart Payment Reminders",
    description:
      "Never miss a payment! Set up automated reminders for your customers and suppliers to ensure timely collections and disbursements, improving your cash flow.",
  },
  {
    icon: "☁️",
    title: "Secure Cloud Data Storage",
    description:
      "Your valuable dairy data is safe and accessible from anywhere. Enjoy peace of mind with secure cloud storage, ensuring your records are always backed up and available.",
  },
];

const FeaturesPage = () => {
  const { colors } = useTheme();

  return (
    <div
      className="py-16 md:py-24 px-4"
      style={{ backgroundColor: colors.background }} // Apply background color from theme
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero Section for Features */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: colors.primary }} // Primary color for heading
          >
            Empower Your Dairy Business with DigiDairy
          </h1>
          <p
            className="text-xl md:text-2xl italic"
            style={{ color: colors.textSecondary }} // Secondary text color for sub-heading
          >
            Smart tools designed for modern dairy farming.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES_DATA.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-lg shadow-lg text-center transform transition-transform duration-300 hover:scale-105"
              style={{
                backgroundColor: colors.surface, // Surface color for feature cards
                border: `1px solid ${colors.border}`, // Border for definition
              }}
            >
              <div
                className="text-5xl mb-4"
                role="img"
                aria-label={feature.title}
              >
                {feature.icon}
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: colors.primary }} // Primary color for feature titles
              >
                {feature.title}
              </h3>
              <p className="text-lg" style={{ color: colors.textPrimary }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;

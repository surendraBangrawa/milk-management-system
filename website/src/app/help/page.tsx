"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

// Define the shape of an FAQ item
interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "What is DigiDairy?",
    answer:
      "DigiDairy is a comprehensive mobile and web application designed to help dairy farmers and businesses manage their daily milk transactions, expenses, and income efficiently. It automates milk pricing based on fat/SNF, generates reports, and streamlines financial tracking.",
  },
  {
    question: "How does automated milk pricing work?",
    answer:
      "You can upload your specific milk rate lists (based on fat percentage and/or SNF) into the DigiDairy app. When you record a transaction, the app automatically calculates the milk price according to the configured rates, saving you manual effort and ensuring accuracy.",
  },
  {
    question: "Can I track both milk sales and purchases?",
    answer:
      "Yes, DigiDairy supports both roles. Whether you are a dairy farmer selling milk to a collection center or a milk vendor purchasing from multiple farmers, you can track all your transactions seamlessly within the app.",
  },
  {
    question: "What kind of reports can I generate?",
    answer:
      "DigiDairy offers a variety of detailed reports, including daily, weekly, and monthly summaries, expense reports, income statements, and individual ledger reports for customers and suppliers. These reports provide valuable insights into your dairy business's financial health.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. DigiDairy uses secure cloud storage to protect your data. All your records are backed up and accessible only to you, ensuring the confidentiality and integrity of your sensitive business information.",
  },
  {
    question: "How do I get technical support?",
    answer:
      "For technical assistance, you can visit our Contact Us page for email support details or refer to the troubleshooting guides within the app's help section.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes, DigiDairy offers a free trial period for new users to experience its full range of features. You can sign up directly from our website or download the app to get started.",
  },
];

const HelpFAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null); // State to manage which accordion item is open
  const { colors } = useTheme();

  // Add type annotation for 'index'
  const toggleAccordion = (index: number) => {
    // <--- Fixed: index is now typed as 'number'
    setOpenIndex(openIndex === index ? null : index); // Toggle open/close
  };

  return (
    <div
      className="py-16 md:py-24 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div
        className="max-w-4xl mx-auto p-8 md:p-12 rounded-lg shadow-xl"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="text-center mb-12">
          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: colors.primary }}
          >
            Help & Frequently Asked Questions
          </h1>
          <p
            className="text-md md:text-lg italic"
            style={{ color: colors.textSecondary }}
          >
            Find answers to common questions about DigiDairy.
          </p>
        </div>

        <section className="space-y-4">
          {FAQ_DATA.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden transition-all duration-300"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <button
                className="w-full flex justify-between items-center p-5 text-left text-xl font-semibold"
                onClick={() => toggleAccordion(index)}
                style={{
                  color: colors.textPrimary,
                  backgroundColor: "transparent",
                }}
              >
                {item.question}
                <span
                  className="transform transition-transform duration-300"
                  style={{
                    color: colors.primary, // Accent color for the icon
                    transform:
                      openIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-max-height duration-300 ease-in-out ${
                  openIndex === index ? "max-h-screen" : "max-h-0"
                }`}
              >
                <p
                  className="p-5 pt-0 text-lg"
                  style={{ color: colors.textSecondary }} // Secondary text for answer
                >
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </section>

        <div className="text-center mt-12">
          <p className="text-lg mb-4" style={{ color: colors.textPrimary }}>
            Can&apos;t find what you&apos;re looking for? Reach out to us!
          </p>
          <Link
            href="/contact"
            className="inline-block py-3 px-8 rounded-full font-semibold text-lg transition duration-300 transform hover:scale-105"
            style={{
              backgroundColor: colors.primary,
              color: colors.surface,
              boxShadow: `0 4px 6px -1px ${colors.shadow}`,
            }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQPage;

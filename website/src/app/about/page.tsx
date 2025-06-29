"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

const AboutUsPage = () => {
  const { colors } = useTheme();

  return (
    <div
      className="py-16 md:py-24 px-4"
      style={{ backgroundColor: colors.background }} // Apply background color from theme
    >
      <div
        className="max-w-4xl mx-auto p-8 md:p-12 rounded-lg shadow-xl"
        style={{ backgroundColor: colors.surface }} // Apply surface color from theme
      >
        <div className="text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: colors.primary }} // Apply primary color
          >
            Our Story: Empowering Dairy Farmers
          </h1>
          <p
            className="text-xl md:text-2xl italic"
            style={{ color: colors.textSecondary }} // Apply secondary text color
          >
            Simplifying dairy management, one smart solution at a time.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color
            >
              Our Mission
            </h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: colors.textPrimary }} // Apply primary text color
            >
              At DigiDairy, our mission is to revolutionize dairy farm financial
              management by providing intuitive, automated, and reliable
              software solutions. We aim to empower dairy farmers with the tools
              they need to track expenses, manage income, and make informed
              decisions, ultimately leading to greater efficiency and
              profitability.
            </p>
          </div>
          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color
            >
              Our Vision
            </h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: colors.textPrimary }} // Apply primary text color
            >
              We envision a future where every dairy operation, regardless of
              size, can effortlessly manage its finances, freeing up valuable
              time to focus on what matters most: caring for their livestock and
              growing their business. DigiDairy strives to be the trusted
              partner for dairy professionals worldwide.
            </p>
          </div>
        </div>

        {/* Why Choose Us / Our Values */}
        <div
          className="p-8 md:p-12 rounded-lg mb-20"
          style={{ backgroundColor: colors.surface }}
        >
          <h2
            className="text-3xl font-bold text-center mb-8"
            style={{ color: colors.primary }} // Apply primary color
          >
            Why DigiDairy? Our Core Values
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3
                className="font-semibold text-xl mb-2"
                style={{ color: colors.primary }} // Apply primary color
              >
                Innovation
              </h3>
              <p style={{ color: colors.textPrimary }}>
                We constantly seek new ways to simplify complex processes and
                integrate cutting-edge technology into our solutions.
              </p>
            </div>
            <div>
              <h3
                className="font-semibold text-xl mb-2"
                style={{ color: colors.primary }} // Apply primary color
              >
                Reliability
              </h3>
              <p style={{ color: colors.textPrimary }}>
                Farmers depend on us, and we are committed to providing a robust
                and dependable platform they can always trust.
              </p>
            </div>
            <div>
              <h3
                className="font-semibold text-xl mb-2"
                style={{ color: colors.primary }} // Apply primary color
              >
                User-Centric Design
              </h3>
              <p style={{ color: colors.textPrimary }}>
                Our software is built with the farmer in mind, ensuring ease of
                use and a seamless experience.
              </p>
            </div>
            <div>
              <h3
                className="font-semibold text-xl mb-2"
                style={{ color: colors.primary }} // Apply primary color
              >
                Support
              </h3>
              <p style={{ color: colors.textPrimary }}>
                We stand by our users with dedicated support, ensuring they get
                the most out of DigiDairy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;

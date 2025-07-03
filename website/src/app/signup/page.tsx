"use client";

/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { useTheme } from "@/context/ThemeContext";

const ContactUsPage = () => {
  const { colors } = useTheme();

  return (
    <div
      className="py-16 md:py-24 px-4"
      style={{ backgroundColor: colors.background }}
    >
      {" "}
      {/* Removed bg-gray-50 as main in layout provides it */}
      <div
        className="max-w-4xl mx-auto p-8 md:p-12 rounded-lg shadow-xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Hero Section for Contact Page */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: colors.primary }}
          >
            Get in Touch with DigiDairy
          </h1>
          <p
            className="text-xl md:text-2xl italic"
            style={{ color: colors.textSecondary }}
          >
            We're here to help answer your questions.
          </p>
        </div>

        <div className="mb-12">
          <h2
            className="text-3xl font-bold mb-6"
            style={{ color: colors.primary }}
          >
            Our Contact Details
          </h2>
          <div
            className="space-y-6 text-lg"
            style={{ color: colors.textPrimary }}
          >
            <p>
              <span className="font-semibold">Phone:</span>{" "}
              <a
                href="tel:+918875353053"
                className="hover:underline"
                style={{ color: colors.primary }}
              >
                +91 88753 53053
              </a>{" "}
              (Mon-Fri, 9 AM - 6 PM IST)
            </p>
            <p>
              <span className="font-semibold">Address:</span>
              <br />
              DigiDairy Solutions Pvt. Ltd.
              <br />
              5A Vivekanada Marg,
              <br />
              Sri Ganganagar, Rajasthan 335001,
              <br />
              India
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3
            className="font-semibold text-xl mb-3"
            style={{ color: colors.primary }}
          >
            Grievance Redressal
          </h3>
          <p className="text-lg mb-2" style={{ color: colors.textPrimary }}>
            For any unresolved issues or complaints, please contact our
            Grievance Officer:
          </p>
          <p className="text-lg" style={{ color: colors.textPrimary }}>
            <strong>Name:</strong> Surendra Kumar
            <br />
            <strong>Email:</strong>{" "}
            <a
              href="mailto:digidairyraj@gmail.com"
              className="hover:underline"
              style={{ color: colors.primary }}
            >
              digidairyraj@gmail.com
            </a>
            <br />
            <strong>Phone:</strong> +91 88753 53053 (Mon-Fri, 10 AM - 5 PM IST)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;

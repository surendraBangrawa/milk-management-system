/* eslint-disable react/no-unescaped-entities */

"use client"; // This component needs to be a Client Component to use ThemeContext

import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext"; // Import ThemeContext

const TermsAndConditionsPage = () => {
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
        <div className="text-center mb-12">
          <h1
            className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: colors.primary }} // Apply primary color
          >
            Terms & Conditions
          </h1>
          <p
            className="text-md md:text-lg italic"
            style={{ color: colors.textSecondary }} // Apply secondary text color
          >
            Effective Date: June 29, 2025
          </p>
        </div>

        <section
          className="space-y-8 text-lg leading-relaxed"
          style={{ color: colors.textPrimary }} // Apply primary text color for general content
        >
          <p>
            Welcome to DigiDairy! These Terms and Conditions ("Terms") govern
            your use of the DigiDairy mobile application and website
            (collectively, the "Service") provided by DigiDairy Solutions Pvt.
            Ltd. ("we", "our", "us"). By accessing or using our Service, you
            agree to be bound by these Terms. If you disagree with any part of
            the terms, then you may not access the Service.
          </p>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or by using the Service, you signify your
              agreement to these Terms, our Privacy Policy, and any other
              policies or guidelines posted on the Service. If you do not agree
              to these Terms, you must not use our Service.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              2. Your Account
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must be at least 18 years old to use the Service.</li>
              <li>
                You are responsible for maintaining the confidentiality of your
                account password and are responsible for all activities that
                occur under your account.
              </li>
              <li>
                You agree to notify us immediately of any unauthorized use of
                your account or any other breach of security.
              </li>
              <li>
                You must provide accurate, complete, and up-to-date registration
                information.
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              3. Use of the Service
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                The Service is provided for your personal and business use to
                manage dairy-related expenses and income.
              </li>
              <li>
                You agree not to use the Service for any unlawful purpose or in
                any way that interrupts, damages, or impairs the Service.
              </li>
              <li>
                You are responsible for all data, text, information, usernames,
                graphics, images, photographs, profiles, audio, video clips, and
                links that you submit, post, and display on the Service.
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              4. Milk Pricing Automation & Data Accuracy
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                While our Service automates milk pricing based on your uploaded
                rate lists, we are not responsible for the accuracy of the rate
                lists you provide.
              </li>
              <li>
                You are solely responsible for ensuring the accuracy and
                legality of all data you input into the Service.
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              5. Fees and Payments
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Certain features of the Service may require payment. All fees
                are clearly stated within the Service.
              </li>
              <li>
                Payments are processed by third-party payment processors. We are
                not responsible for their terms or practices.
              </li>
              <li>
                All fees are non-refundable unless otherwise stated in our
                <Link
                  href="/refund"
                  className="hover:underline"
                  style={{ color: colors.primary }} // Apply primary color for links
                >
                  Refund Policy
                </Link>
                .
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              6. Intellectual Property
            </h2>
            <p>
              The Service and its original content, features, and functionality
              are and will remain the exclusive property of DigiDairy Solutions
              Pvt. Ltd. and its licensors.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              7. Termination
            </h2>
            <p>
              We may terminate or suspend your account immediately, without
              prior notice or liability, for any reason whatsoever, including
              without limitation if you breach the Terms.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              8. Disclaimer of Warranties
            </h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We
              make no representations or warranties of any kind, express or
              implied, as to the operation of their services, or the
              information, content or materials included therein.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              9. Limitation of Liability
            </h2>
            <p>
              In no event shall DigiDairy Solutions Pvt. Ltd., nor its
              directors, employees, partners, agents, suppliers, or affiliates,
              be liable for any indirect, incidental, special, consequential or
              punitive damages, including without limitation, loss of profits,
              data, use, goodwill, or other intangible losses, resulting from
              (i) your access to or use of or inability to access or use the
              Service; (ii) any conduct or content of any third party on the
              Service.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              10. Governing Law
            </h2>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of India, without regard to its conflict of law provisions.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              11. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. We will try to provide at least 30 days'
              notice prior to any new terms taking effect.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              12. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                By email:{" "}
                <a
                  href="mailto:legal@digidairy.com"
                  className="hover:underline"
                  style={{ color: colors.primary }} // Apply primary color for links
                >
                  legal@digidairy.com
                </a>
              </li>
              <li>
                By visiting our contact page:{" "}
                <Link
                  href="/contact"
                  className="hover:underline"
                  style={{ color: colors.primary }} // Apply primary color for links
                >
                  digidairy.com/contact
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;

/* eslint-disable react/no-unescaped-entities */

"use client"; // This component needs to be a Client Component to use ThemeContext

import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext"; // Import ThemeContext

const RefundPolicyPage = () => {
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
            Refund Policy
          </h1>
          <p
            className="text-md md:text-lg italic"
            style={{ color: colors.textSecondary }} // Apply secondary text color
          >
            Last Updated: June 29, 2025
          </p>
        </div>

        <section
          className="space-y-8 text-lg leading-relaxed"
          style={{ color: colors.textPrimary }} // Apply primary text color for general content
        >
          <p>
            At DigiDairy, we are committed to providing a high-quality service
            to our users. We understand that circumstances may change, and we
            aim to be fair and transparent with our refund process. Please read
            our Refund Policy carefully.
          </p>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              1. General Policy
            </h2>
            <p>
              All sales for subscriptions and in-app purchases through the
              DigiDairy Service are generally final and non-refundable. However,
              we may offer refunds in specific circumstances as outlined below.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              2. Eligibility for Refund
            </h2>
            <p>
              You may be eligible for a refund under the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Technical Issues:</strong> If you experience persistent,
                unresolvable technical issues directly attributable to the
                DigiDairy Service that prevent you from using the core features,
                and our support team is unable to resolve them within a
                reasonable timeframe (e.g., 7 business days) after you have
                reported the issue.
              </li>
              <li>
                <strong>Accidental Duplicate Purchase:</strong> If you
                accidentally make a duplicate purchase for the same subscription
                or feature.
              </li>
              <li>
                <strong>Withdrawal Period (if applicable):</strong> If local
                laws in your region provide for a "cooling-off" or withdrawal
                period for digital services, and you submit a refund request
                within that legal timeframe.
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              3. Non-Eligible Situations for Refund
            </h2>
            <p>Refunds will generally NOT be issued for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Change of mind or no longer needing the service.</li>
              <li>
                Failure to read the product description or terms of service
                before purchase.
              </li>
              <li>
                Issues caused by your device, internet connection, or
                third-party software.
              </li>
              <li>
                Account termination due to violation of our{" "}
                <Link
                  href="/terms"
                  className="hover:underline"
                  style={{ color: colors.primary }} // Apply primary color for links
                >
                  Terms & Conditions
                </Link>
                .
              </li>
              <li>
                Partial use of a subscription period (refunds are typically not
                prorated).
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              4. How to Request a Refund
            </h2>
            <p>To request a refund, please follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                Send an email to{" "}
                <a
                  href="mailto:billing@digidairy.com"
                  className="hover:underline"
                  style={{ color: colors.primary }} // Apply primary color for links
                >
                  billing@digidairy.com
                </a>{" "}
                within <strong>14 days</strong> of the purchase date.
              </li>
              <li>
                Include your DigiDairy account email, transaction ID, date of
                purchase, the amount paid, and a detailed explanation of why you
                are requesting a refund.
              </li>
              <li>
                Our team will review your request and may ask for additional
                information or troubleshooting steps.
              </li>
              <li>
                If your refund is approved, it will be processed within 7-10
                business days and the funds will be returned to the original
                payment method.
              </li>
            </ol>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              5. Subscription Cancellations
            </h2>
            <p>
              You can cancel your DigiDairy subscription at any time through
              your account settings. Cancellation will take effect at the end of
              your current billing period, and you will continue to have access
              to the Service until then. No refunds will be provided for the
              remaining portion of a billing cycle after cancellation.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              6. Changes to This Refund Policy
            </h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Any
              changes will be effective immediately upon posting the updated
              policy on our website. Your continued use of the Service after any
              such changes constitutes your acceptance of the new Refund Policy.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              7. Contact Us
            </h2>
            <p>
              For any questions regarding this Refund Policy, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                By email:{" "}
                <a
                  href="mailto:billing@digidairy.com"
                  className="hover:underline"
                  style={{ color: colors.primary }} // Apply primary color for links
                >
                  billing@digidairy.com
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

export default RefundPolicyPage;

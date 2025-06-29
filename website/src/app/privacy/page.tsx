/* eslint-disable react/no-unescaped-entities */

"use client"; // This component needs to be a Client Component to use ThemeContext

import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext"; // Import ThemeContext

const PrivacyPolicyPage = () => {
  const { colors } = useTheme(); // Use useContext to access the theme colors

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
            Privacy Policy
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
            Your privacy is of paramount importance to us at DigiDairy. This
            Privacy Policy explains how DigiDairy Solutions Pvt. Ltd. ("we",
            "our", "us") collects, uses, discloses, and safeguards your
            information when you use our DigiDairy application and website
            (collectively, the "Service"). By accessing or using the Service,
            you signify that you have read, understood, and agree to our
            collection, storage, use, and disclosure of your personal
            information as described in this Privacy Policy.
          </p>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              1. Information We Collect
            </h2>
            <p>
              We collect various types of information to provide and improve our
              Service to you:
            </p>
            <h3
              className="font-semibold text-xl mt-4 mb-2"
              style={{ color: colors.primary }} // Apply primary color for subheadings
            >
              Personal Data:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Contact Information:</strong> Name, email address, phone
                number, physical address.
              </li>
              <li>
                <strong>Account Details:</strong> Username, password, role
                (customer/supplier).
              </li>
              <li>
                <strong>Payment Information:</strong> While we use third-party
                payment processors, we may collect billing address and basic
                transaction details. Your full payment card details are not
                stored on our servers.
              </li>
            </ul>
            <h3
              className="font-semibold text-xl mt-4 mb-2"
              style={{ color: colors.primary }} // Apply primary color for subheadings
            >
              Dairy-Related Data:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Milk pricing details, quantity records, transaction records,
                customer/supplier names, and other financial data related to
                your dairy operations that you input into the Service.
              </li>
            </ul>
            <h3
              className="font-semibold text-xl mt-4 mb-2"
              style={{ color: colors.primary }} // Apply primary color for subheadings
            >
              Usage Data:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Information on how the Service is accessed and used (e.g., IP
                address, browser type, pages visited, time spent on pages,
                unique device identifiers, diagnostic data).
              </li>
            </ul>
            <h3
              className="font-semibold text-xl mt-4 mb-2"
              style={{ color: colors.primary }} // Apply primary color for subheadings
            >
              Cookies and Tracking Technologies:
            </h3>
            <p>
              We use cookies and similar tracking technologies to track activity
              on our Service and hold certain information. Cookies are files
              with a small amount of data that may include an anonymous unique
              identifier.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              2. How We Use Your Information
            </h2>
            <p>We use the collected data for various purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain our Service.</li>
              <li>To notify you about changes to our Service.</li>
              <li>
                To allow you to participate in interactive features of our
                Service when you choose to do so.
              </li>
              <li>To provide customer support.</li>
              <li>To monitor the usage of our Service.</li>
              <li>To detect, prevent, and address technical issues.</li>
              <li>To process your transactions and manage your accounts.</li>
              <li>
                To send you reminders, reports, and relevant communications.
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              3. Disclosure of Your Information
            </h2>
            <p>We may share your information in the following situations:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Service Providers:</strong> We may employ third-party
                companies and individuals to facilitate our Service (e.g.,
                payment processing, hosting, analytics).
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with, or
                during negotiations of, any merger, sale of company assets,
                financing, or acquisition of all or a portion of our business to
                another company.
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required to do so by law
                or in response to valid requests by public authorities (e.g., a
                court or a government agency).
              </li>
              <li>
                <strong>With Your Consent:</strong> We may disclose your
                personal information for any other purpose with your consent.
              </li>
            </ul>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              4. Security of Data
            </h2>
            <p>
              The security of your data is important to us, but remember that no
              method of transmission over the Internet or method of electronic
              storage is 100% secure. While we strive to use commercially
              acceptable means to protect your Personal Data, we cannot
              guarantee its absolute security.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              5. Your Data Protection Rights
            </h2>
            <p>
              Depending on your location, you may have certain rights regarding
              your personal data, including the right to access, update, or
              delete the information we have on you. Please contact us to
              exercise these rights.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              6. Links to Other Sites
            </h2>
            <p>
              Our Service may contain links to other sites that are not operated
              by us. If you click on a third-party link, you will be directed to
              that third party's site. We strongly advise you to review the
              Privacy Policy of every site you visit.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              7. Children's Privacy
            </h2>
            <p>
              Our Service does not address anyone under the age of 18
              ("Children"). We do not knowingly collect personally identifiable
              information from anyone under the age of 18.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              8. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date. You are advised to review
              this Privacy Policy periodically for any changes.
            </p>
          </div>

          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: colors.primary }} // Apply primary color for section headings
            >
              9. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                By email:{" "}
                <a
                  href="mailto:digidairyraj@gmail.com"
                  style={{ color: colors.primary }} // Apply primary color for links
                  className="hover:underline"
                >
                  digidairyraj@gmail.com
                </a>
              </li>
              <li>
                By visiting our contact page:{" "}
                <Link
                  href="/contact"
                  style={{ color: colors.primary }} // Apply primary color for links
                  className="hover:underline"
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

export default PrivacyPolicyPage;

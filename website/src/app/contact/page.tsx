/* eslint-disable react/no-unescaped-entities */
import React from "react";

const ContactUsPage = () => {
  return (
    <div className="py-16 md:py-24 px-4">
      {" "}
      {/* Removed bg-gray-50 as main in layout provides it */}
      <div className="max-w-4xl mx-auto">
        {/* Hero Section for Contact Page */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0a7ea4] mb-4">
            Get in Touch with DigiDairy
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 italic">
            We're here to help answer your questions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 bg-white p-8 md:p-12 rounded-lg shadow-xl">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-[#0a7ea4] mb-6">
              Our Contact Details
            </h2>
            <div className="space-y-6 text-lg text-gray-700">
              <p>
                <span className="font-semibold">Email:</span>{" "}
                <a
                  href="mailto:support@digidairy.com"
                  className="text-[#0a7ea4] hover:underline"
                >
                  support@digidairy.com
                </a>
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                <a
                  href="tel:+911234567890"
                  className="text-[#0a7ea4] hover:underline"
                >
                  +91 12345 67890
                </a>{" "}
                (Mon-Fri, 9 AM - 6 PM IST)
              </p>
              <p>
                <span className="font-semibold">Address:</span>
                <br />
                DigiDairy Solutions Pvt. Ltd.
                <br />
                123 Dairy Lane, Milk Market Area,
                <br />
                Sri Ganganagar, Rajasthan 335001,
                <br />
                India
              </p>
              {/* Social Media Links (add actual icons if you have them) */}
              <div className="mt-8">
                <h3 className="font-semibold text-xl mb-3 text-[#0a7ea4]">
                  Connect With Us
                </h3>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="text-[#0a7ea4] hover:text-[#0a5c80] transition-colors duration-200"
                  >
                    {/* Replace with actual social icons (e.g., from Lucide React or Font Awesome) */}
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="w-8 h-8"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-[#0a7ea4] hover:text-[#0a5c80] transition-colors duration-200"
                  >
                    {/* Example: Facebook */}
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="w-8 h-8"
                    >
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.271 0-4.192 2.154-4.192 4.167v3.833z" />
                    </svg>
                  </a>
                  {/* Add Twitter, Instagram etc. */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;

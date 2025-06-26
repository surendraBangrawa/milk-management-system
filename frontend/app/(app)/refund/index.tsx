import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function RefundPolicyScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.refund_policy")}>
      <Section>
        <Heading>Our Policy</Heading>
        <Paragraph>
          If you are not satisfied with our service, we offer a refund for any
          undelivered products or payments made in advance.
        </Paragraph>
      </Section>
      <Section>
        <Heading>How to Request a Refund</Heading>
        <Paragraph>
          To request a refund, please contact our support team through the
          'Contact Us' section with your account details and the reason for the
          request. Refunds are typically processed within 5-7 business days.
        </Paragraph>
      </Section>
      <Paragraph>Last updated: [Date]</Paragraph>
    </StaticInfoScreen>
  );
}

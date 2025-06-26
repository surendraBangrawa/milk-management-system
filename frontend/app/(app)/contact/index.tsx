import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function ContactUsScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.contact_us")}>
      <Section>
        <Heading>Get in Touch</Heading>
        <Paragraph>
          Have questions or need support? We're here to help!
        </Paragraph>
      </Section>
      <Section>
        <Heading>Email</Heading>
        <Paragraph>support@example.com</Paragraph>
        <Heading>Phone</Heading>
        <Paragraph>+1 (234) 567-890</Paragraph>
        <Heading>Address</Heading>
        <Paragraph>123 Dairy Lane, Milkville, MK 45678</Paragraph>
      </Section>
    </StaticInfoScreen>
  );
}

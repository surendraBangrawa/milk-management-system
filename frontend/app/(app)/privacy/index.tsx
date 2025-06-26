import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.privacy_policy")}>
      <Section>
        <Heading>Introduction</Heading>
        <Paragraph>
          Your privacy is important to us. This privacy statement explains the
          personal data [Your App Name] processes, how [Your App Name] processes
          it, and for what purposes.
        </Paragraph>
      </Section>
      <Section>
        <Heading>Data We Collect</Heading>
        <Paragraph>
          We collect data to operate effectively and provide you with the best
          experiences with our services. This includes your name, delivery
          address, and payment information.
        </Paragraph>
      </Section>
      <Paragraph>Last updated: [Date]</Paragraph>
    </StaticInfoScreen>
  );
}

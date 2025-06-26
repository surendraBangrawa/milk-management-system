import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function TermsScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.terms_and_conditions")}>
      <Section>
        <Heading>1. Introduction</Heading>
        <Paragraph>
          Welcome to [Your App Name]! These terms and conditions outline the
          rules and regulations for the use of our application. By accessing
          this app, we assume you accept these terms and conditions.
        </Paragraph>
      </Section>
      <Section>
        <Heading>2. User Accounts</Heading>
        <Paragraph>
          When you create an account with us, you must provide information that
          is accurate, complete, and current at all times. Failure to do so
          constitutes a breach of the Terms.
        </Paragraph>
      </Section>
      <Paragraph>Last updated: [Date]</Paragraph>
    </StaticInfoScreen>
  );
}

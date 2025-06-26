import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function HelpScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.help")}>
      <Section>
        <Heading>Frequently Asked Questions</Heading>
        <Paragraph>
          How do I update my daily milk quantity?
          {"\n"}
          You can update your daily quantity from the 'Summary' tab on the home
          screen.
        </Paragraph>
        <Paragraph>
          How can I view my past bills?
          {"\n"}
          All past and current bills are available in the 'Manage Subscription'
          section.
        </Paragraph>
      </Section>
    </StaticInfoScreen>
  );
}

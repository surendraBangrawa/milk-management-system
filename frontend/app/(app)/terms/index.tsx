import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function TermsScreen() {
  const { t } = useTranslation();
  // Ensure the date is dynamically pulled or consistently managed.
  const lastUpdatedDate = "June 29, 2025"; // Current date

  return (
    <StaticInfoScreen title={t("more.terms_and_conditions")}>
      <Section>
        <Heading>{t("more.terms_intro_heading")}</Heading>
        <Paragraph>{t("more.terms_intro_paragraph")}</Paragraph>
      </Section>
      <Section>
        <Heading>{t("more.terms_accounts_heading")}</Heading>
        <Paragraph>{t("more.terms_accounts_paragraph")}</Paragraph>
      </Section>
      <Paragraph>
        {t("more.terms_last_updated", { date: lastUpdatedDate })}
      </Paragraph>
    </StaticInfoScreen>
  );
}

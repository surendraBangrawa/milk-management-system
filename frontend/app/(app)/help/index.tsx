import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import React from "react";
import { useTranslation } from "react-i18next";

export default function HelpScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.help")}>
      <Section>
        <Heading>{t("more.help_faq_heading")}</Heading>
        <Paragraph>
          {t("more.help_faq_q1")}
          {"\n"}
          {t("more.help_faq_a1")}
        </Paragraph>
        <Paragraph>
          {t("more.help_faq_q2")}
          {"\n"}
          {t("more.help_faq_a2")}
        </Paragraph>
      </Section>
    </StaticInfoScreen>
  );
}

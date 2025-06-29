import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function AboutUsScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.about_us")}>
      <Section>
        <Heading>{t("more.about_us_mission_heading")}</Heading>
        <Paragraph>{t("more.about_us_mission_paragraph")}</Paragraph>
      </Section>
      <Section>
        <Heading>{t("more.about_us_who_we_are_heading")}</Heading>
        <Paragraph>{t("more.about_us_who_we_are_paragraph")}</Paragraph>
      </Section>
    </StaticInfoScreen>
  );
}

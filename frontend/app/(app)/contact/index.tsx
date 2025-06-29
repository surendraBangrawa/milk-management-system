import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import React from "react";
import { useTranslation } from "react-i18next";

export default function ContactUsScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.contact_us")}>
      <Section>
        <Heading>{t("more.contact_us_get_in_touch_heading")}</Heading>
        <Paragraph>{t("more.contact_us_get_in_touch_paragraph")}</Paragraph>
      </Section>
      <Section>
        <Heading>{t("more.contact_us_email_heading")}</Heading>
        <Paragraph>{t("more.contact_us_email_address")}</Paragraph>
        <Heading>{t("more.contact_us_phone_heading")}</Heading>
        <Paragraph>{t("more.contact_us_phone_number")}</Paragraph>
        <Heading>{t("more.contact_us_address_heading")}</Heading>
        <Paragraph>{t("more.contact_us_address_details")}</Paragraph>
      </Section>
    </StaticInfoScreen>
  );
}

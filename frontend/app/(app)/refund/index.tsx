import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function RefundPolicyScreen() {
  const { t } = useTranslation();
  // Ensure the date is dynamically pulled or consistently managed.
  // For now, we'll use the current date to reflect up-to-dateness.
  const lastUpdatedDate = "June 29, 2025";

  return (
    <StaticInfoScreen title={t("more.refund_policy")}>
      <Section>
        <Heading>{t("more.refund_policy_our_policy_heading")}</Heading>
        <Paragraph>{t("more.refund_policy_our_policy_paragraph")}</Paragraph>
      </Section>
      <Section>
        <Heading>{t("more.refund_policy_how_to_request_heading")}</Heading>
        <Paragraph>
          {t("more.refund_policy_how_to_request_paragraph")}
        </Paragraph>
      </Section>
      <Paragraph>
        {t("more.refund_policy_last_updated", { date: lastUpdatedDate })}
      </Paragraph>
    </StaticInfoScreen>
  );
}

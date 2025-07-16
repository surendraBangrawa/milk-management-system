import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  // You might want to get the last updated date dynamically, e.g., from an API or a constant.
  // For now, let's use a static date.
  const lastUpdatedDate = "June 29, 2025";

  return (
    <StaticInfoScreen title={t("more.privacy_policy")}>
      <Section>
        <Heading>{t("more.privacy_policy_intro_heading")}</Heading>
        <Paragraph>{t("more.privacy_policy_intro_paragraph")}</Paragraph>
      </Section>
      <Section>
        <Heading>{t("more.privacy_policy_data_heading")}</Heading>
        <Paragraph>{t("more.privacy_policy_data_paragraph")}</Paragraph>
      </Section>
      <Paragraph>
        {t("more.privacy_policy_last_updated", { date: lastUpdatedDate })}
      </Paragraph>
    </StaticInfoScreen>
  );
}

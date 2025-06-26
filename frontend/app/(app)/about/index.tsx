import React from "react";
import { useTranslation } from "react-i18next";
import StaticInfoScreen from "@/components/StaticInfoScreen";
import { Heading, Paragraph, Section } from "@/components/InfoPageComponents";

export default function AboutUsScreen() {
  const { t } = useTranslation();
  return (
    <StaticInfoScreen title={t("more.about_us")}>
      <Section>
        <Heading>Our Mission</Heading>
        <Paragraph>
          Welcome to [Your App Name]! Our mission is to simplify milk management
          for households and businesses, ensuring timely deliveries and accurate
          billing. We are dedicated to providing a seamless and reliable
          service.
        </Paragraph>
      </Section>
      <Section>
        <Heading>Who We Are</Heading>
        <Paragraph>
          We are a team of passionate developers and dairy enthusiasts committed
          to revolutionizing the way milk is managed and delivered.
        </Paragraph>
      </Section>
    </StaticInfoScreen>
  );
}

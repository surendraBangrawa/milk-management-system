import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: "DigiDairy - Your Smart Dairy Expense Manager",
  description:
    "Automate milk pricing, manage expenses, and track income for your dairy business with DigiDairy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased flex flex-col min-h-screen"
      >
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BackofficeNav } from "@/components/navigation/BackofficeNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexova Backoffice",
  description:
    "Internal operations interface for Nexova hiring workflows and talent pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackofficeNav />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/nav/site-header";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MHM Broadband Infrastructure Mapping",
  description:
    "Broadband infrastructure, investment, and gap analysis across Methodist Healthcare Ministries' Texas service area.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${openSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider delay={150}>
          <SiteHeader />
          <div className="flex-1 flex flex-col">{children}</div>
        </TooltipProvider>
      </body>
    </html>
  );
}

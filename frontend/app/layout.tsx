import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const montserratAlternates = Montserrat_Alternates({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat-alternates",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sun* Annual Awards 2025",
  description: "SAA 2025 — Sun* Kudos & Annual Awards",
};

// Parallel route slot consumed by intercepted overlays (e.g.
// `app/@modal/(.)kudos/new/page.tsx`). Next.js always supplies the slot
// (using `app/@modal/default.tsx` as fallback), so it is non-optional.
export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${montserratAlternates.variable} antialiased`}
      >
        {children}
        {modal}
      </body>
    </html>
  );
}

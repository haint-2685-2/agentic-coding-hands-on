import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, Montserrat_Alternates, Orbitron } from "next/font/google";
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

// Modern futuristic display font for the homepage countdown tiles.
// Orbitron has a clean geometric look that reads as a digital readout
// without the dated pixel/CRT feel.
const digitalFont = Orbitron({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-digital",
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
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${montserratAlternates.variable} ${digitalFont.variable} antialiased`}
      >
        {children}
        {modal}
      </body>
    </html>
  );
}

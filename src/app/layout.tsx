import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AtomQuest 🎯 | Goal Setting & Tracking",
  description: "Goal Setting & Tracking Portal for Atomberg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "14px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            },
          }}
        />
      </body>
    </html>
  );
}

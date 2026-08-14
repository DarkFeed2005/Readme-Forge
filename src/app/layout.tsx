import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readme Forge — AI-Powered README Generator",
  description:
    "Generate polished, accurate README.md files for any public GitHub repository using Llama 3.3 on Groq.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
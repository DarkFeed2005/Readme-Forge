import type { Metadata } from "next";
import "./globals.css";
import Background3D from "@/components/Background3D";

export const metadata: Metadata = {
  title: "Readme Forge — AI-Powered README Generator",
  description:
    "Generate polished, accurate README.md files for any public GitHub repository using OpenRouter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Background3D />
        {children}
      </body>
    </html>
  );
}
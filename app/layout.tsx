import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamPrep AI — Study Smarter, Score Higher",
  description: "AI-powered quizzes and past papers for Cambridge and Pakistan Board students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
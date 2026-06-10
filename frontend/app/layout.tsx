import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Dropout Prediction Dashboard",
  description: "Graduation project dashboard for predicting student dropout risk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ChatWidget } from "@/components/chat/ChatWidget";
import GoogleAuthProvider from "@/components/providers/GoogleAuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Dental Clinic AI - Hệ thống phòng khám nha khoa",
  description: "Hệ thống hỗ trợ phòng khám nha khoa với chatbot AI 24/7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <GoogleAuthProvider>
          {children}
          <ChatWidget />
          <Toaster position="top-right" />
        </GoogleAuthProvider>
      </body>
    </html>
  );
}

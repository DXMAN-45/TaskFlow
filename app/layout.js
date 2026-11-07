
import "./globals.css";
import Script from "next/script";
import SessionWrapper from "./component/SessionWrapper";
export const metadata = {
  title: "TaskFlow - Task Management App",
  description: "TaskFlow is a task management app that helps you organize your tasks and projects efficiently with your team.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased bg-gray-100 text-slate-900"
    >
      <body className="min-h-full flex flex-col">
         <SessionWrapper>
        {children}
      </SessionWrapper></body>

    </html>
  );
}

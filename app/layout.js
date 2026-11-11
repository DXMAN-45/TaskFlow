
import "./globals.css";
import SessionWrapper from "./component/SessionWrapper";

export const metadata = {
  metadataBase: new URL("https://task-flow-dun-six.vercel.app/"),

  title: {
    default: "TaskFlow – Team Task Management",
    template: "%s | TaskFlow",
  },

  description:
    "TaskFlow helps you organize projects, manage tasks, collaborate with your team, and track progress efficiently in one place.",

  applicationName: "TaskFlow",

  keywords: [
    "TaskFlow",
    "task management",
    "project management",
    "team collaboration",
    "team task manager",
    "project tracking",
    "productivity",
  ],

  authors: [{ name: "TaskFlow" }],
  creator: "TaskFlow",
  publisher: "TaskFlow",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "TaskFlow",
    title: "TaskFlow – Team Task Management",
    description:
      "Organize projects, manage tasks, and collaborate with your team using TaskFlow.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TaskFlow – Team Task Management",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TaskFlow – Team Task Management",
    description:
      "Organize projects, manage tasks, and collaborate with your team using TaskFlow.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  category: "technology",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased bg-gray-100 text-slate-900"
    >
      <body className="min-h-full flex flex-col">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}

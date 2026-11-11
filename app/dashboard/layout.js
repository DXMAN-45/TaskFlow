
export const metadata = {
  title: "Dashboard",
  description:
    "Manage your projects, organize tasks, monitor progress, and collaborate with your team using TaskFlow.",

  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DashboardLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
}

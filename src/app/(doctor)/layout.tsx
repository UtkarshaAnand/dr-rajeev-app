import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doctor Portal - Dr. Rajeev Ranjan',
  description: 'Doctor PWA for managing patient chats',
  manifest: '/manifest.json',
  themeColor: '#017CA6',
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


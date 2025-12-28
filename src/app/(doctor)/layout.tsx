import { Metadata } from 'next';
import InstallPWA from '@/components/InstallPWA';
import { PWAMeta } from '@/components/PWAMeta';
import FCMRegistration from '@/components/FCMRegistration';

export const metadata: Metadata = {
  title: 'Doctor Portal - Dr. Rajeev Ranjan',
  description: 'Doctor PWA for managing patient chats',
  manifest: '/manifest-doctor.json',
  themeColor: '#017CA6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dr. Rajeev Portal',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PWAMeta />
      <FCMRegistration />
      {children}
      <InstallPWA />
    </>
  );
}


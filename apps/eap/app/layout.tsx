import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'EAP - Flu Vaccination Platform',
  description: 'Event Admin Portal',
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}

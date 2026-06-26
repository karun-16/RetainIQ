import { redirect } from 'next/navigation';

export default function Home() {
  // For the MVP, we just redirect straight to the login page
  // In a real app, we might check for an existing session here and redirect to dashboard instead
  redirect('/login');
}

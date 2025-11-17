import { redirect } from 'next/navigation';

export default function HomePage() {
    // Redirection vers dashboard si authentifié
    redirect('/dashboard');
}

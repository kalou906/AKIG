interface Props { message: string }

export function ErrorBanner({ message }: Props) {
    return (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            Erreur: {message}
        </div>
    );
}

export default ErrorBanner;


export function Button({ children, variant = 'primary', className = '', ...props }) {
    const base = 'px-4 py-2 rounded font-semibold transition-colors';
    const variants = {
        primary: 'bg-akig-primary text-white hover:bg-indigo-700',
        secondary: 'bg-akig-secondary text-white hover:bg-purple-700',
        success: 'bg-akig-success text-white hover:bg-green-700',
        danger: 'bg-akig-danger text-white hover:bg-red-700',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
        ghost: 'text-gray-700 hover:bg-gray-100',
    };
    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
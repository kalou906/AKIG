export function Card({ title, actions, children }) {
    return (
        <div className="card">
            <div className="flex items-center justify-between mb-2">
                {title && <h3 className="card-title">{title}</h3>}
                {actions}
            </div>
            {children}
        </div>
    );
}
import { NavLink, Outlet } from 'react-router-dom';

export default function SidebarLayout() {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-4 flex flex-col justify-between">
                <div>
                    <h1 className="text-xl font-bold mb-6">🏨 Admin Hotel</h1>
                    <nav className="space-y-2">
                        <MenuLink to="/" label="Dashboard" />
                        <MenuLink to="/rooms" label="Habitaciones" />
                        <MenuLink to="/reports" label="Reportes" />
                        <MenuLink to="/cleaning" label="Limpiezas" />
                        <MenuLink to="/maintenance" label="Mantenimiento" />
                        <MenuLink to="/maintenance-history" label="Historial de mantenimientos" /> 
                        <MenuLink to="/devices" label="Dispositivos" />

                    </nav>

                </div>
                <footer className="text-xs text-gray-400">v1.0</footer>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}

function MenuLink({ to, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-gray-100 ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                }`
            }
        >
            {label}
        </NavLink>
    );
}
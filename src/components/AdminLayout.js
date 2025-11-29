import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    navigate("/admin/login");
  };

  const navItems = [
    { path: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
    { path: "/admin/movies", icon: "movie", label: "Movies" },
    { path: "/admin/halls", icon: "theaters", label: "Halls" },

    {
      path: "/admin/reservations",
      icon: "confirmation_number",
      label: "Reservations",
    },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-background-light dark:bg-background-dark border-r border-primary/20 dark:border-primary/30 flex flex-col fixed h-full">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-black dark:text-white">
              Movie Admin
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                  isActive(item.path)
                    ? "bg-primary/20 dark:bg-primary/30 text-primary"
                    : "text-black/60 dark:text-white/60 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary"
                } transition-colors`}
                to={item.path}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-black/60 dark:text-white/60 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary w-full transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

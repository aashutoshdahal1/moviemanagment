import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../contexts/UserAuthContext";

const Header = ({ variant = "cinemagic" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const scrollToComingSoon = () => {
    const comingSoonSection = document.getElementById("coming-soon");
    if (comingSoonSection) {
      comingSoonSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-primary h-8 w-8">
              <svg
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {variant === "cinemagic" ? "CineMagic" : "CineTicket"}
            </h1>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              className={`text-sm font-medium transition-colors ${
                isActive("/") || isActive("/dashboard")
                  ? "text-primary dark:text-primary"
                  : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
              }`}
              to="/"
            >
              {variant === "cinemagic" ? "Now Showing" : "Home"}
            </Link>
            {variant === "cinemagic" && (
              <button
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                onClick={scrollToComingSoon}
              >
                Coming Soon
              </button>
            )}
            {variant === "userticket" && (
              <>
                <Link
                  to="/user/tickets"
                  className={`text-sm font-medium transition-colors ${
                    isActive("/user/tickets")
                      ? "text-primary dark:text-primary"
                      : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                  }`}
                >
                  My Tickets
                </Link>
                <Link
                  to="/user/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive("/user/dashboard")
                      ? "text-primary dark:text-primary"
                      : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                  }`}
                >
                  My Dashboard
                </Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {variant === "cineticket" && (
              <button className="relative rounded-full p-2 text-background-dark/60 dark:text-background-light/60 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary transition-colors">
                <svg
                  fill="currentColor"
                  height="20"
                  viewBox="0 0 256 256"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z" />
                </svg>
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              </button>
            )}

            {/* User Authentication Section */}
            {variant === "userticket" && user && (
              <button
                onClick={handleLogout}
                className="h-10 items-center justify-center rounded-lg bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-600 transition-colors flex"
              >
                Logout
              </button>
            )}
            {variant !== "ticket" && variant !== "userticket" && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/user/dashboard"
                      className={`hidden h-10 items-center justify-center rounded-lg px-4 text-sm font-bold transition-colors sm:flex ${
                        isActive("/user/dashboard")
                          ? "bg-primary text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="hidden h-10 items-center justify-center rounded-lg bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-600 transition-colors sm:flex"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/user/login"
                      className="hidden h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90 transition-colors sm:flex"
                    >
                      Login
                    </Link>
                    <Link
                      to="/admin/login"
                      className="hidden h-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 px-4 text-sm font-bold text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors sm:flex"
                    >
                      Admin
                    </Link>
                  </div>
                )}
              </>
            )}

            {variant !== "ticket" && (
              <button className="rounded-full p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden">
                <span className="material-symbols-outlined">menu</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

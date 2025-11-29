import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import PasswordChangeModal from "../components/PasswordChangeModal";
import { API_BASE_URL } from "../config/api";
const AdminDashboard = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statsData, setStatsData] = useState({
    totalMovies: 0,
    totalHalls: 0,
    totalReservations: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      // Fetch statistics
      const statsResponse = await fetch(
        `${API_BASE_URL}/api/admin/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        setStatsData(statsResult);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Refetch when window regains focus (user comes back from another tab/page)
    const handleFocus = () => {
      fetchDashboardData();
    };

    // Refetch when page becomes visible (user switches back to this tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboardData();
      }
    };

    // Listen for custom movie data change events
    const handleMovieDataChanged = () => {
      fetchDashboardData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("movieDataChanged", handleMovieDataChanged);

    // Cleanup
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("movieDataChanged", handleMovieDataChanged);
    };
  }, [fetchDashboardData]);

  const statsCards = [
    {
      title: "Total Movies",
      value: loading ? "..." : statsData.totalMovies.toString(),
      bgClass: "bg-background-light dark:bg-primary/10",
    },
    {
      title: "Total Halls",
      value: loading ? "..." : (statsData.totalHalls || 0).toString(),
      bgClass: "bg-background-light dark:bg-primary/10",
    },
    {
      title: "Total Reservations",
      value: loading ? "..." : statsData.totalReservations.toString(),
      bgClass: "bg-background-light dark:bg-primary/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Dashboard
            </h1>
            <p className="text-black/60 dark:text-white/60 mt-1">
              Welcome back, Admin!
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh statistics"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgClass} p-6 rounded-xl border border-primary/20 dark:border-primary/30`}
            >
              <p className="text-sm font-medium text-black/60 dark:text-white/60">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-black dark:text-white mt-2">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="max-w-md mx-auto">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                Quick Actions
              </h2>
              <div className="mt-4 space-y-3">
                <Link
                  to="/admin/movies"
                  className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Add New Movie
                </Link>
                <Link
                  to="/admin/movies"
                  className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-primary/20 dark:bg-primary/30 text-primary text-sm font-bold hover:bg-primary/30 dark:hover:bg-primary/40 transition-colors"
                >
                  View All Movies
                </Link>
                <Link
                  to="/admin/reservations"
                  className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-blue-500 text-white text-sm font-bold shadow-sm hover:bg-blue-600 transition-colors"
                >
                  <span className="material-symbols-outlined mr-2 text-lg">
                    confirmation_number
                  </span>
                  Validate Tickets
                </Link>
              </div>
            </div>

            {/* Security Section */}
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                Security
              </h2>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-orange-500 text-white text-sm font-bold shadow-sm hover:bg-orange-600 transition-colors"
                >
                  <span className="material-symbols-outlined mr-2 text-lg">
                    lock_reset
                  </span>
                  Change Password
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="font-medium mb-1">Security Tips:</p>
                  <ul className="space-y-1">
                    <li>• Use a strong password with 8+ characters</li>
                    <li>• Include uppercase, lowercase, numbers & symbols</li>
                    <li>• Change your password regularly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </AdminLayout>
  );
};

export default AdminDashboard;

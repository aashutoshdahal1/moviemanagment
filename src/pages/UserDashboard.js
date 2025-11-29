import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { API_BASE_URL } from "../config/api";
import { useUserAuth } from "../contexts/UserAuthContext";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/user/login");
      return;
    }
    fetchUserBookings();

    // Auto-refresh bookings every 30 seconds to catch admin changes
    const interval = setInterval(() => {
      fetchUserBookings(true); // Background refresh won't show loading states
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchUserBookings = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${API_BASE_URL}/api/bookings/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
        if (!isBackgroundRefresh) {
          setError(null);
        }
      } else {
        if (!isBackgroundRefresh) {
          setError(data.message || "Failed to fetch bookings");
        }
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      if (!isBackgroundRefresh) {
        setError("Unable to load bookings. Please try again.");
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return time24;
    const [hours, minutes] = time24.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
    }
  };

  const getStatusMessage = (booking) => {
    if (booking.status === "cancelled") {
      if (booking.cancellationReason === "movie_deleted") {
        return "This booking was cancelled because the movie has been removed from our system.";
      } else if (booking.cancellationReason === "admin_cancelled") {
        return "This booking was cancelled by theater administration.";
      } else {
        return "This booking has been cancelled.";
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen">
        <Header variant="cineticket" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading your bookings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200 min-h-screen">
      <Header variant="cineticket" />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* User Profile Header */}
            <div className="bg-white dark:bg-card-dark rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome back, {user?.name}!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Bookings Section */}
            <div className="bg-white dark:bg-card-dark rounded-lg shadow-lg">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Bookings ({bookings.length})
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View and manage your movie reservations
                </p>
              </div>

              {error ? (
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="text-red-500 dark:text-red-400 mb-4">
                      <span className="material-symbols-outlined text-6xl">
                        error
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {error}
                    </p>
                    <button
                      onClick={fetchUserBookings}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <span className="material-symbols-outlined text-6xl">
                        movie_creation
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                      No bookings yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                      Book your first movie to see your reservations here
                    </p>
                    <button
                      onClick={() => navigate("/")}
                      className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Browse Movies
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div
                        key={booking._id}
                        className={`border rounded-lg p-6 transition-shadow ${
                          booking.status === "cancelled"
                            ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                            : "border-gray-200 dark:border-gray-700 hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          {/* Movie Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {booking.movieImageUrl &&
                              booking.status !== "cancelled" ? (
                                <img
                                  src={booking.movieImageUrl}
                                  alt={booking.movieTitle}
                                  className="w-20 h-28 rounded object-cover flex-shrink-0"
                                  onError={(e) => {
                                    // Replace with movie icon instead of placeholder
                                    e.target.style.display = "none";
                                    const parent = e.target.parentNode;
                                    if (
                                      !parent.querySelector(
                                        ".movie-icon-fallback"
                                      )
                                    ) {
                                      const iconDiv =
                                        document.createElement("div");
                                      iconDiv.className =
                                        "movie-icon-fallback w-20 h-28 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0";
                                      iconDiv.innerHTML =
                                        '<span class="material-symbols-outlined text-3xl text-gray-400">movie</span>';
                                      parent.appendChild(iconDiv);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-28 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                  <span className="material-symbols-outlined text-3xl text-gray-400">
                                    {booking.status === "cancelled"
                                      ? "block"
                                      : "movie"}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                  {booking.movieTitle}
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                                      booking.status
                                    )}`}
                                  >
                                    {booking.status.charAt(0).toUpperCase() +
                                      booking.status.slice(1)}
                                  </span>
                                  <span className="text-sm text-primary font-medium">
                                    Booking ID: {booking.bookingId}
                                  </span>
                                </div>

                                {getStatusMessage(booking) && (
                                  <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                                    {getStatusMessage(booking)}
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">
                                      event
                                    </span>
                                    {formatDate(booking.date)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">
                                      schedule
                                    </span>
                                    {formatTime12Hour(booking.time)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">
                                      location_on
                                    </span>
                                    {booking.hall}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">
                                      chair
                                    </span>
                                    {booking.seats.join(", ")}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="lg:text-right lg:min-w-[200px]">
                            <div className="text-2xl font-bold text-primary mb-2">
                              ${booking.totalPrice}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {booking.seats.length} seat
                              {booking.seats.length > 1 ? "s" : ""}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Booked on:{" "}
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </div>

                            {booking.status === "confirmed" && (
                              <div className="mt-4">
                                <button
                                  onClick={() =>
                                    navigate("/confirmation", {
                                      state: { booking },
                                    })
                                  }
                                  className="w-full lg:w-auto bg-primary text-white px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors"
                                >
                                  View Ticket
                                </button>
                              </div>
                            )}

                            {booking.status === "cancelled" && (
                              <div className="mt-4">
                                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                                  Booking Cancelled
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/")}
                className="bg-primary text-white p-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
              >
                <div className="material-symbols-outlined text-2xl mb-2">
                  movie
                </div>
                <div className="font-medium">Browse Movies</div>
              </button>
              <button
                onClick={fetchUserBookings}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white p-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
              >
                <div className="material-symbols-outlined text-2xl mb-2">
                  refresh
                </div>
                <div className="font-medium">Refresh Bookings</div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;

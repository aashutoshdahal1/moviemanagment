import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../config/api";

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [movieFilter, setMovieFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [validationFilter, setValidationFilter] = useState("");
  const [bookingIdSearch, setBookingIdSearch] = useState("");

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bookings/admin/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setReservations(data.bookings);
      } else {
        setError(data.message || "Failed to fetch reservations");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError("Unable to load reservations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/admin/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setReservations(
          reservations.map((reservation) =>
            reservation._id === bookingId
              ? { ...reservation, status: newStatus }
              : reservation
          )
        );
      } else {
        alert(
          "Failed to update booking status: " +
            (data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status. Please try again.");
    }
  };

  const handleValidationToggle = async (bookingId, currentValidationStatus) => {
    try {
      const newValidationStatus = !currentValidationStatus;

      const response = await fetch(
        `${API_BASE_URL}/api/bookings/admin/${bookingId}/validate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            isValidated: newValidationStatus,
            adminName: "Admin", // You can get this from admin context if available
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Determine new status based on validation
        const newStatus = newValidationStatus ? "confirmed" : "cancelled";

        // Update local state with both validation and status changes
        setReservations(
          reservations.map((reservation) =>
            reservation._id === bookingId
              ? {
                  ...reservation,
                  isValidated: newValidationStatus,
                  validatedAt: data.booking.validatedAt,
                  validatedBy: data.booking.validatedBy,
                  status: newStatus,
                }
              : reservation
          )
        );
      } else {
        alert(
          "Failed to update validation status: " +
            (data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error updating validation:", error);
      alert("Failed to update validation status. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
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
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      (reservation.userId?.name || "Unknown User")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      reservation.movieTitle
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      reservation.bookingId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBookingId =
      bookingIdSearch === "" ||
      reservation.bookingId
        .toLowerCase()
        .includes(bookingIdSearch.toLowerCase());
    const matchesMovie =
      movieFilter === "" || reservation.movieTitle === movieFilter;
    const matchesStatus =
      statusFilter === "" || reservation.status === statusFilter;
    const matchesValidation =
      validationFilter === "" ||
      (validationFilter === "validated" && reservation.isValidated) ||
      (validationFilter === "unvalidated" && !reservation.isValidated);

    return (
      matchesSearch &&
      matchesMovie &&
      matchesStatus &&
      matchesValidation &&
      matchesBookingId
    );
  });

  const uniqueMovies = [...new Set(reservations.map((r) => r.movieTitle))];
  const uniqueStatuses = [...new Set(reservations.map((r) => r.status))];

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading reservations...
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reservations ({reservations.length})
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage all reservations made by users.
          </p>
        </div>

        {error ? (
          <div className="bg-white dark:bg-card-dark rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <span className="material-symbols-outlined text-6xl">
                  error
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchReservations}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-card-dark rounded-lg shadow-sm p-4">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-light dark:bg-background-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Search by name, movie, booking ID..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  confirmation_number
                </span>
                <input
                  className="pl-10 pr-4 py-2 rounded-lg bg-background-light dark:bg-background-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Booking ID..."
                  type="text"
                  value={bookingIdSearch}
                  onChange={(e) => setBookingIdSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={movieFilter}
                  onChange={(e) => setMovieFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-background-light dark:bg-background-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="">All Movies</option>
                  {uniqueMovies.map((movie) => (
                    <option key={movie} value={movie}>
                      {movie}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-background-light dark:bg-background-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="">All Status</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={validationFilter}
                  onChange={(e) => setValidationFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-background-light dark:bg-background-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="">All Validation</option>
                  <option value="validated">Validated</option>
                  <option value="unvalidated">Unvalidated</option>
                </select>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Booking ID
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Customer
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Movie
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Date & Time
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
                      Seats
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Hall
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Total
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Status
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
                      Validated
                    </th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr
                      key={reservation._id}
                      className="border-b border-slate-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="p-4 text-sm font-medium text-primary">
                        {reservation.bookingId}
                      </td>
                      <td className="p-4 text-sm text-slate-800 dark:text-slate-100">
                        <div>
                          <div className="font-medium">
                            {reservation.userId?.name || "Unknown User"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {reservation.userId?.phone || "No phone"}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        <div className="font-medium">
                          {reservation.movieTitle}
                        </div>
                        {reservation.movieImageUrl && (
                          <div className="text-xs text-slate-400">
                            Duration: {reservation.movieDuration}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        <div>{formatDate(reservation.date)}</div>
                        <div className="text-xs">
                          {formatTime12Hour(reservation.time)}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                        <div className="font-medium">
                          {reservation.seats.length}
                        </div>
                        <div className="text-xs">
                          {reservation.seats.join(", ")}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {reservation.hall}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">
                        ${reservation.totalPrice}
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          {reservation.status.charAt(0).toUpperCase() +
                            reservation.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() =>
                              handleValidationToggle(
                                reservation._id,
                                reservation.isValidated
                              )
                            }
                            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                              reservation.isValidated
                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                            }`}
                            title={
                              reservation.isValidated
                                ? `Validated by ${
                                    reservation.validatedBy || "Admin"
                                  }`
                                : "Click to mark as validated"
                            }
                          >
                            <span className="material-symbols-outlined text-lg">
                              {reservation.isValidated
                                ? "check_circle"
                                : "radio_button_unchecked"}
                            </span>
                          </button>
                          {reservation.isValidated &&
                            reservation.validatedAt && (
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                {new Date(
                                  reservation.validatedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          {reservation.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    reservation._id,
                                    "confirmed"
                                  )
                                }
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                title="Confirm"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  check_circle
                                </span>
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    reservation._id,
                                    "cancelled"
                                  )
                                }
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                title="Cancel"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  cancel
                                </span>
                              </button>
                            </>
                          )}
                          {reservation.status === "confirmed" && (
                            <button
                              onClick={() =>
                                handleStatusChange(reservation._id, "cancelled")
                              }
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              title="Cancel"
                            >
                              <span className="material-symbols-outlined text-sm">
                                cancel
                              </span>
                            </button>
                          )}
                          <button
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="View Details"
                            onClick={() => {
                              alert(
                                `Booking Details:\nID: ${
                                  reservation.bookingId
                                }\nCustomer: ${
                                  reservation.userId?.name || "Unknown"
                                }\nMovie: ${
                                  reservation.movieTitle
                                }\nSeats: ${reservation.seats.join(
                                  ", "
                                )}\nTotal: $${
                                  reservation.totalPrice
                                }\nBooked: ${new Date(
                                  reservation.createdAt
                                ).toLocaleString()}`
                              );
                            }}
                          >
                            <span className="material-symbols-outlined text-sm">
                              visibility
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Count */}
            {filteredReservations.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <span className="material-symbols-outlined text-6xl">
                    event_seat
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  No reservations found matching your criteria.
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Try adjusting your search filters or check back later.
                </p>
              </div>
            )}

            {filteredReservations.length > 0 && (
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredReservations.length} of {reservations.length}{" "}
                reservations
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReservationManagement;

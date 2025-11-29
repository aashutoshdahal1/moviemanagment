import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "../components/Header";

const ReservationConfirmation = () => {
  const [bookingData, setBookingData] = useState(null);
  const location = useLocation();

  const formatTime12Hour = (time) => {
    if (!time) return time;

    // Check if time is already in 12-hour format (contains AM/PM)
    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }

    // Convert from 24-hour to 12-hour format
    const [hours, minutes] = time.split(":");
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

  useEffect(() => {
    // Check if booking data came from navigation state (from UserDashboard)
    if (location.state && location.state.booking) {
      const booking = location.state.booking;
      setBookingData({
        movie: {
          title: booking.movieTitle,
          time: formatTime12Hour(booking.time),
        },
        seats: booking.seats,
        total: booking.totalPrice,
        theater: booking.hall,
        date: formatDate(booking.date),
        reservationId: booking.bookingId,
      });
    } else {
      // Check localStorage for recent booking (from seat booking flow)
      const data =
        localStorage.getItem("currentBooking") ||
        localStorage.getItem("bookingConfirmation");
      if (data) {
        const booking = JSON.parse(data);
        setBookingData({
          movie: {
            title: booking.movieTitle || booking.movie?.title,
            time: formatTime12Hour(booking.time || booking.movie?.time),
          },
          seats: booking.seats,
          total: booking.totalPrice || booking.totalAmount,
          theater: booking.hall || booking.theater,
          date: formatDate(booking.date),
          reservationId: booking.bookingId,
        });
      } else {
        // Fallback data if no booking data found
        setBookingData({
          movie: { title: "The Midnight Hour", time: "7:30 PM" },
          seats: ["A1", "A2", "A3"],
          total: 45,
          theater: "Grand Cinema 6",
          date: "Sat, Oct 26",
          reservationId: "RES-789012",
        });
      }
    }
  }, [location.state]);

  if (!bookingData) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
        <div className="flex min-h-screen flex-col">
          <Header variant="ticket" />
          <main className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Loading...
              </h2>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <div className="flex flex-col min-h-screen">
        <Header variant="userticket" />

        <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl mx-auto bg-white dark:bg-card-dark shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
            <div className="p-8 sm:p-10 text-center">
              <div className="flex justify-center items-center mx-auto h-20 w-20 rounded-full bg-primary/10 dark:bg-primary/20 mb-6">
                <span className="material-symbols-outlined text-primary text-5xl">
                  confirmation_number
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reservation Confirmed!
              </h2>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Your tickets have been successfully booked. Please find the
                details below.
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700/50 px-8 sm:px-10 py-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Movie
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {bookingData.movie.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Theater
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {bookingData.theater}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Showtime
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {bookingData.movie.time}, {bookingData.date}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Seats
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    <div className="flex gap-2 flex-wrap">
                      {bookingData.seats.map((seat, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Amount
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-primary">
                    ${bookingData.total}.00
                  </dd>
                </div>
                <div className="sm:col-span-2 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Reservation ID
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white tracking-wider">
                    {bookingData.reservationId}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 dark:bg-background-dark px-8 sm:px-10 py-6">
              <div className="flex justify-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-background-light dark:focus:ring-offset-background-dark transition-all duration-300"
                >
                  Book Another Movie
                </Link>
                <Link
                  to="/user/dashboard"
                  className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background-light dark:focus:ring-offset-background-dark transition-all duration-300"
                >
                  <span className="material-symbols-outlined mr-2">
                    local_activity
                  </span>
                  View My Tickets
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReservationConfirmation;

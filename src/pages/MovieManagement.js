import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../config/api";

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    hall: "",
    genre: "",
    description: "",
    status: "active",
    showtimes: [{ date: "", time: "", price: 15 }],
    times: [""], // Keep for backward compatibility
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [halls, setHalls] = useState([]);

  // Fetch movies and halls on component mount
  useEffect(() => {
    fetchMovies();
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/halls/active/list`);
      const data = await response.json();
      if (data.success) {
        setHalls(data.halls);
      }
    } catch (error) {
      console.error("Error fetching halls:", error);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/movies`);
      const data = await response.json();
      if (data.success) {
        setMovies(data.movies);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShowtimeChange = (index, field, value) => {
    const newShowtimes = [...formData.showtimes];
    // Handle number conversion for price field
    if (field === "price") {
      newShowtimes[index][field] = value === "" ? "" : parseFloat(value) || 0;
    } else {
      newShowtimes[index][field] = value;
    }
    setFormData((prev) => ({
      ...prev,
      showtimes: newShowtimes,
    }));
  };

  const addShowtimeSlot = () => {
    setFormData((prev) => ({
      ...prev,
      showtimes: [...prev.showtimes, { date: "", time: "", price: 15 }],
    }));
  };

  const removeShowtimeSlot = (index) => {
    if (formData.showtimes.length > 1) {
      const newShowtimes = formData.showtimes.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        showtimes: newShowtimes,
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      duration: "",
      hall: "",
      genre: "",
      description: "",
      status: "active",
      showtimes: [{ date: "", time: "", price: 15 }],
      times: [""],
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingMovie(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("hall", formData.hall);
      formDataToSend.append("genre", formData.genre);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("status", formData.status);

      // Send showtimes data
      const validShowtimes = formData.showtimes.filter(
        (st) => st.date && st.time
      );
      if (validShowtimes.length > 0) {
        formDataToSend.append("showtimes", JSON.stringify(validShowtimes));
      } else {
        // Fallback to old times format for backward compatibility
        formDataToSend.append(
          "times",
          JSON.stringify(formData.times.filter((time) => time.trim()))
        );
      }

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const token = localStorage.getItem("adminToken");
      const url = editingMovie
        ? `${API_BASE_URL}/api/movies/${editingMovie._id}`
        : `${API_BASE_URL}/api/movies`;

      const method = editingMovie ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        await fetchMovies();
        setShowModal(false);
        resetForm();
        
        // Dispatch custom event to notify other components (like AdminDashboard)
        window.dispatchEvent(new CustomEvent('movieDataChanged'));
        
        alert(
          editingMovie
            ? "Movie updated successfully!"
            : "Movie created successfully!"
        );
      } else {
        alert(data.message || "Error saving movie");
      }
    } catch (error) {
      console.error("Error saving movie:", error);
      alert("Error saving movie. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);

    // Convert existing data to new format if needed
    let showtimes = [{ date: "", time: "", price: 15 }];
    if (movie.showtimes && movie.showtimes.length > 0) {
      showtimes = movie.showtimes.map((showtime) => ({
        date: showtime.date || "",
        time: showtime.time || "",
        price: showtime.price !== undefined ? showtime.price : 15,
      }));
    } else if (movie.times && movie.times.length > 0) {
      // Convert old times format to new showtime format with today's date
      const today = new Date().toISOString().split("T")[0];
      showtimes = movie.times.map((time) => ({
        date: today,
        time: time || "",
        price: 15, // Default price for legacy data
      }));
    }

    setFormData({
      title: movie.title,
      duration: movie.duration,
      hall: movie.hall,
      genre: movie.genre || "",
      description: movie.description || "",
      status: movie.status,
      showtimes: showtimes,
      times: movie.times || [""],
    });
    setImagePreview(movie.imageUrl);
    setShowModal(true);
  };

  const handleDelete = async (movieId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this movie?\n\nWarning: This will also cancel all existing bookings for this movie."
      )
    ) {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${API_BASE_URL}/api/movies/${movieId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          await fetchMovies();
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('movieDataChanged'));
          
          const cancelledCount = data.cancelledBookings || 0;
          if (cancelledCount > 0) {
            alert(
              `Movie deleted successfully!\n${cancelledCount} booking(s) were automatically cancelled.`
            );
          } else {
            alert("Movie deleted successfully!");
          }
        } else {
          alert(data.message || "Error deleting movie");
        }
      } catch (error) {
        console.error("Error deleting movie:", error);
        alert("Error deleting movie. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddMovie = () => {
    resetForm();
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "coming-soon":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button className="md:hidden">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Movies
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-600 dark:text-gray-400 hover:text-primary">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button
              onClick={handleAddMovie}
              className="bg-primary text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              Add Movie
            </button>
          </div>
        </div>

        {/* Movies Table */}
        <div className="bg-white dark:bg-card-dark rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 min-w-[250px]" scope="col">
                    Title
                  </th>
                  <th className="px-6 py-3" scope="col">
                    Duration
                  </th>
                  <th className="px-6 py-3" scope="col">
                    Hall
                  </th>
                  <th className="px-6 py-3 min-w-[200px]" scope="col">
                    Showtimes
                  </th>
                  <th className="px-6 py-3" scope="col">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading movies...</span>
                      </div>
                    </td>
                  </tr>
                ) : movies.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <span className="text-gray-500">
                        No movies found. Add your first movie!
                      </span>
                    </td>
                  </tr>
                ) : (
                  movies.map((movie) => (
                    <tr
                      key={movie._id}
                      className="bg-white dark:bg-transparent border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={movie.imageUrl}
                            alt={movie.title}
                            className="w-12 h-12 object-cover rounded-lg mr-3"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {movie.title}
                            </div>
                            {movie.genre && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {movie.genre}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{movie.duration}</td>
                      <td className="px-6 py-4">{movie.hall}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {movie.times.slice(0, 3).map((time, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded bg-primary/10 text-primary"
                            >
                              {time}
                            </span>
                          ))}
                          {movie.times.length > 3 && (
                            <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              +{movie.times.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
       
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-sm">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(movie._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <nav
            aria-label="Table navigation"
            className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800"
          >
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                1-5
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {movies.length}
              </span>
            </span>
            <ul className="inline-flex items-center -space-x-px">
              <li>
                <button className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                  Previous
                </button>
              </li>
              <li>
                <button className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                  1
                </button>
              </li>
              <li>
                <button className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                  2
                </button>
              </li>
              <li>
                <button className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Add/Edit Movie Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-card-dark rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingMovie ? "Edit Movie" : "Add New Movie"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Movie Poster
                  </label>
                  <div className="flex items-center space-x-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-32 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                        required={!editingMovie}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Upload JPEG, PNG, GIF or WebP (Max: 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Movie Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleFormChange}
                      placeholder="e.g., 2h 30m"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hall *
                    </label>
                    <select
                      name="hall"
                      value={formData.hall}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Hall</option>
                      {halls.map((hall) => (
                        <option key={hall._id} value={hall.name}>
                          {hall.name} ({hall.type} - {hall.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Genre
                    </label>
                    <input
                      type="text"
                      name="genre"
                      value={formData.genre}
                      onChange={handleFormChange}
                      placeholder="e.g., Action, Drama, Comedy"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="coming-soon">Coming Soon</option>
        
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Movie description..."
                  />
                </div>

                {/* Showtimes */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Showtimes *
                    </label>
                    <button
                      type="button"
                      onClick={addShowtimeSlot}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      + Add Showtime
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.showtimes.map((showtime, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={showtime.date}
                            onChange={(e) =>
                              handleShowtimeChange(
                                index,
                                "date",
                                e.target.value
                              )
                            }
                            min={new Date().toISOString().split("T")[0]}
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            value={showtime.time}
                            onChange={(e) =>
                              handleShowtimeChange(
                                index,
                                "time",
                                e.target.value
                              )
                            }
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            value={showtime.price || ""}
                            onChange={(e) =>
                              handleShowtimeChange(
                                index,
                                "price",
                                e.target.value
                              )
                            }
                            min="0"
                            step="0.01"
                            required
                            placeholder="15.00"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        {formData.showtimes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeShowtimeSlot(index)}
                            className="px-2 py-2 text-red-600 hover:text-red-800 mt-5"
                            title="Remove showtime"
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Add showtimes with specific dates, times, and pricing. Dates
                    must be today or in the future. Default price is $15 per
                    seat.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading
                      ? "Saving..."
                      : editingMovie
                      ? "Update Movie"
                      : "Add Movie"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default MovieManagement;

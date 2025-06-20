/*import React, { useState, useEffect } from "react";
import "./App.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const OPENWEATHER_API_KEY = "1b85a622b127d4f974f4de6ce5b57fc3";

// 🔁 New helper component to re-center the map dynamically
function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon]);
    }
  }, [lat, lon, map]);
  return null;
}

function calculateAQI(pm25) {
  const breakpoints = [
    { aqiLow: 0, aqiHigh: 50, concLow: 0.0, concHigh: 12.0 },
    { aqiLow: 51, aqiHigh: 100, concLow: 12.1, concHigh: 35.4 },
    { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4 },
    { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
    { aqiLow: 201, aqiHigh: 300, concLow: 150.5, concHigh: 250.4 },
    { aqiLow: 301, aqiHigh: 400, concLow: 250.5, concHigh: 350.4 },
    { aqiLow: 401, aqiHigh: 500, concLow: 350.5, concHigh: 500.4 },
  ];

  for (let i = 0; i < breakpoints.length; i++) {
    const bp = breakpoints[i];
    if (pm25 >= bp.concLow && pm25 <= bp.concHigh) {
      return (
        ((bp.aqiHigh - bp.aqiLow) / (bp.concHigh - bp.concLow)) *
        (pm25 - bp.concLow) +
        bp.aqiLow
      ).toFixed(0);
    }
  }
  return "AQI out of range";
}

function getAQICategory(aqi) {
  const value = parseInt(aqi);
  if (value <= 50) return "Good 🟢";
  if (value <= 100) return "Moderate 🟡";
  if (value <= 150) return "Unhealthy for Sensitive Groups 🟠";
  if (value <= 200) return "Unhealthy 🔴";
  if (value <= 300) return "Very Unhealthy 🟣";
  if (value <= 500) return "Hazardous 🟤";
  return "Out of range";
}

const getBackgroundImage = (weatherMain) => {
  if (!weatherMain) return null;
  const condition = weatherMain.toLowerCase();
  if (condition.includes("clear"))
    return "url('https://plus.unsplash.com/premium_photo-1677105700661-dbfad22793ca?q=80&w=1168&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("cloud"))
    return "url('https://plus.unsplash.com/premium_photo-1668381153652-16f52f4348bf?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("rain") || condition.includes("drizzle"))
    return "url('https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("thunderstorm"))
    return "url('https://images.unsplash.com/photo-1595810033299-5a6fcda2aa71?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("snow"))
    return "url('https://plus.unsplash.com/premium_photo-1661605639899-1543c54fa154?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze"))
    return "url('https://images.unsplash.com/photo-1653618417841-79d6672aa395?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  return "url('https://images.unsplash.com/photo-1620998051604-95ff17ccc537?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0')";
};

function App() {
  const [location, setLocation] = useState(null);
  const [postalCode, setPostalCode] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [pollution, setPollution] = useState(null);
  const [pollutionError, setPollutionError] = useState("");
  const [detailedAQI, setDetailedAQI] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        fetchFromCoords(latitude, longitude);
      },
      (err) => {
        setError("Permission denied or location unavailable");
        console.error(err);
      }
    );
  }, []);

  const fetchFromCoords = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      const addr = data.address;

      const districtName =
        addr.state_district ||
        addr.county ||
        addr.city_district ||
        addr.region ||
        addr.city ||
        addr.town ||
        addr.village ||
        "District not found";

      const filteredAddress = [addr.locality, addr.county, addr.state, addr.country]
        .filter(Boolean)
        .join(", ");

      setDistrict(districtName);
      setPostalCode(addr.postcode || "Postal code not found");

      // 🔧 Ensure lat/lon are numbers
      setLocation({
        ...data,
        display_name: filteredAddress,
        lat: Number(lat),
        lon: Number(lon),
      });

      fetchWeather(lat, lon);
      fetchPollution(lat, lon);
    } catch (err) {
      setError("Error fetching location data");
      console.error(err);
    }
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setWeatherError("Failed to fetch weather info");
    }
  };

  const fetchPollution = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await res.json();
      setPollution(data);

      const pm25 = data.list[0].components.pm2_5;
      const aqi = calculateAQI(pm25);
      setDetailedAQI(aqi);
    } catch (err) {
      setPollutionError("Failed to fetch air pollution info");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchInput.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&format=json&limit=1`
      );
      const data = await res.json();

      if (data.length === 0) {
        setError("Location not found.");
        return;
      }

      const { lat, lon } = data[0];
      fetchFromCoords(lat, lon);
      setError("");
    } catch (err) {
      setError("Failed to find location.");
      console.error(err);
    }
  };

  // === New handler for Current Location button ===
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchFromCoords(latitude, longitude);
        setError("");
        setSearchInput(""); // Clear search input when returning to current location
      },
      (err) => {
        setError("Permission denied or location unavailable");
        console.error(err);
      }
    );
  };

  return (
    <>
      <div
        className="background"
        style={{ backgroundImage: getBackgroundImage(weather?.weather[0]?.main) }}
      ></div>

      <div className="container" style={{ padding: "2rem" }}>
        <form
          onSubmit={handleSearch}
          style={{
            marginBottom: "1.5rem",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            gap: "0.7rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Enter city or PIN code"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "24px",
              border: "1.5px solid #888",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
              fontSize: "1rem",
              outline: "none",
              flexGrow: 1,
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "24px",
              backgroundColor: "#2c5aa0",
              color: "white",
              border: "none",
              boxShadow: "0 4px 12px rgba(44, 90, 160, 0.6)",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Search
          </button>

          {/* Current Location Button *//*}
<button
type="button"
onClick={handleCurrentLocation}
style={{
padding: "0.6rem 1.5rem",
borderRadius: "24px",
backgroundColor: "#2c5aa0",
color: "white",
border: "none",
boxShadow: "0 4px 12px rgba(44, 90, 160, 0.6)",
fontWeight: "600",
fontSize: "1rem",
cursor: "pointer",
whiteSpace: "nowrap",
}}
>
Current Location
</button>
</form>

<h2>Your Location Info</h2>
{error && <p className="error">{error}</p>}
{location ? (
<div>
<p><strong>Address:</strong> {location.display_name}</p>
<p><strong>District:</strong> {district}</p>
<p><strong>Postal Code (PIN):</strong> {postalCode}</p>

<div style={{ height: "300px", marginTop: "1.5rem", borderRadius: "12px", overflow: "hidden" }}>
<MapContainer
center={[location.lat, location.lon]}
zoom={15}
scrollWheelZoom={false}
style={{ height: "100%", width: "100%" }}
>
<TileLayer
attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
<Marker position={[location.lat, location.lon]}>
<Popup>You are here</Popup>
</Marker>
{/* 🔁 Re-center the map when location changes *//*}
<RecenterMap lat={location.lat} lon={location.lon} />
</MapContainer>
</div>

<h2>Weather Info</h2>
{weatherError && <p className="error">{weatherError}</p>}
{weather ? (
<div>
<p><strong>Temperature:</strong> {weather.main.temp}°C</p>
<p><strong>Weather:</strong> {weather.weather[0].description}</p>
<p><strong>Humidity:</strong> {weather.main.humidity}%</p>
<p><strong>Wind:</strong> {weather.wind.speed} m/s</p>
</div>
) : (
!weatherError && <p>Loading weather data...</p>
)}

<h2>Air Quality Index (AQI)</h2>
{pollutionError && <p className="error">{pollutionError}</p>}
{pollution ? (
<div>
<p><strong>OpenWeatherMap AQI (1–5 scale):</strong> {pollution.list[0].main.aqi}</p>
<p><strong>Detailed AQI (based on PM2.5):</strong> {detailedAQI} ({getAQICategory(detailedAQI)})</p>
<p><strong>PM2.5 concentration:</strong> {pollution.list[0].components.pm2_5} µg/m³</p>
<p><strong>PM10 concentration:</strong> {pollution.list[0].components.pm10} µg/m³</p>
</div>
) : (
!pollutionError && <p>Loading air pollution data...</p>
)}
</div>
) : (
!error && <p>Loading your location info...</p>
)}
</div>
</>
);
}

export default App;
*/


import React, { useState, useEffect } from "react";
import "./App.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const OPENWEATHER_API_KEY = "1b85a622b127d4f974f4de6ce5b57fc3";

// 🔁 New helper component to re-center the map dynamically
function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon]);
    }
  }, [lat, lon, map]);
  return null;
}

function calculateAQI(pm25) {
  const breakpoints = [
    { aqiLow: 0, aqiHigh: 50, concLow: 0.0, concHigh: 12.0 },
    { aqiLow: 51, aqiHigh: 100, concLow: 12.1, concHigh: 35.4 },
    { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4 },
    { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
    { aqiLow: 201, aqiHigh: 300, concLow: 150.5, concHigh: 250.4 },
    { aqiLow: 301, aqiHigh: 400, concLow: 250.5, concHigh: 350.4 },
    { aqiLow: 401, aqiHigh: 500, concLow: 350.5, concHigh: 500.4 },
  ];

  for (let i = 0; i < breakpoints.length; i++) {
    const bp = breakpoints[i];
    if (pm25 >= bp.concLow && pm25 <= bp.concHigh) {
      return (
        ((bp.aqiHigh - bp.aqiLow) / (bp.concHigh - bp.concLow)) *
        (pm25 - bp.concLow) +
        bp.aqiLow
      ).toFixed(0);
    }
  }
  return "AQI out of range";
}

function getAQICategory(aqi) {
  const value = parseInt(aqi);
  if (value <= 50) return "Good 🟢";
  if (value <= 100) return "Moderate 🟡";
  if (value <= 150) return "Unhealthy for Sensitive Groups 🟠";
  if (value <= 200) return "Unhealthy 🔴";
  if (value <= 300) return "Very Unhealthy 🟣";
  if (value <= 500) return "Hazardous 🟤";
  return "Out of range";
}

const getBackgroundImage = (weatherMain) => {
  if (!weatherMain) return null;
  const condition = weatherMain.toLowerCase();
  if (condition.includes("clear"))
    return "url('https://plus.unsplash.com/premium_photo-1677105700661-dbfad22793ca?q=80&w=1168&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("cloud"))
    return "url('https://plus.unsplash.com/premium_photo-1668381153652-16f52f4348bf?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("rain") || condition.includes("drizzle"))
    return "url('https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("thunderstorm"))
    return "url('https://images.unsplash.com/photo-1595810033299-5a6fcda2aa71?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("snow"))
    return "url('https://plus.unsplash.com/premium_photo-1661605639899-1543c54fa154?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze"))
    return "url('https://images.unsplash.com/photo-1653618417841-79d6672aa395?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0')";
  return "url('https://images.unsplash.com/photo-1620998051604-95ff17ccc537?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0')";
};

function App() {
  const [location, setLocation] = useState(null);
  const [postalCode, setPostalCode] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [pollution, setPollution] = useState(null);
  const [pollutionError, setPollutionError] = useState("");
  const [detailedAQI, setDetailedAQI] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  // PWA install prompt states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        fetchFromCoords(latitude, longitude);
      },
      (err) => {
        setError("Permission denied or location unavailable");
        console.error(err);
      }
    );
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const fetchFromCoords = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      const addr = data.address;

      const districtName =
        addr.state_district ||
        addr.county ||
        addr.city_district ||
        addr.region ||
        addr.city ||
        addr.town ||
        addr.village ||
        "District not found";

      const filteredAddress = [addr.locality, addr.county, addr.state, addr.country]
        .filter(Boolean)
        .join(", ");

      setDistrict(districtName);
      setPostalCode(addr.postcode || "Postal code not found");

      setLocation({
        ...data,
        display_name: filteredAddress,
        lat: Number(lat),
        lon: Number(lon),
      });

      fetchWeather(lat, lon);
      fetchPollution(lat, lon);
    } catch (err) {
      setError("Error fetching location data");
      console.error(err);
    }
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setWeatherError("Failed to fetch weather info");
    }
  };

  const fetchPollution = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await res.json();
      setPollution(data);

      const pm25 = data.list[0].components.pm2_5;
      const aqi = calculateAQI(pm25);
      setDetailedAQI(aqi);
    } catch (err) {
      setPollutionError("Failed to fetch air pollution info");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchInput.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&format=json&limit=1`
      );
      const data = await res.json();

      if (data.length === 0) {
        setError("Location not found.");
        return;
      }

      const { lat, lon } = data[0];
      fetchFromCoords(lat, lon);
      setError("");
    } catch (err) {
      setError("Failed to find location.");
      console.error(err);
    }
  };

  // === Current Location button handler ===
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchFromCoords(latitude, longitude);
        setError("");
        setSearchInput("");
      },
      (err) => {
        setError("Permission denied or location unavailable");
        console.error(err);
      }
    );
  };

  // === Install button click handler ===
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <>
      <div
        className="background"
        style={{ backgroundImage: getBackgroundImage(weather?.weather[0]?.main) }}
      ></div>

      {/* Install popup banner at top center */}
      {showInstallBtn && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#2c5aa0",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(44, 90, 160, 0.6)",
            fontWeight: "600",
            cursor: "pointer",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            maxWidth: "90%",
            minWidth: "300px",
            justifyContent: "space-between",
          }}
        >
          <span>Install this app for a better experience</span>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleInstallClick}
              style={{
                backgroundColor: "white",
                color: "#2c5aa0",
                border: "none",
                borderRadius: "24px",
                padding: "8px 16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(44, 90, 160, 0.5)",
              }}
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBtn(false)}
              aria-label="Close"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontWeight: "bold",
                fontSize: "20px",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="container" style={{ padding: "2rem" }}>
        <form
          onSubmit={handleSearch}
          style={{
            marginBottom: "1.5rem",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            gap: "0.7rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Enter city or PIN code"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "24px",
              border: "1.5px solid #888",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
              fontSize: "1rem",
              outline: "none",
              flexGrow: 1,
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "24px",
              backgroundColor: "#2c5aa0",
              color: "white",
              border: "none",
              boxShadow: "0 4px 12px rgba(44, 90, 160, 0.6)",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Search
          </button>

          {/* Current Location Button */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "24px",
              backgroundColor: "#2c5aa0",
              color: "white",
              border: "none",
              boxShadow: "0 4px 12px rgba(44, 90, 160, 0.6)",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Current Location
          </button>
        </form>

        <h2>Your Location Info</h2>
        {error && <p className="error">{error}</p>}
        {location ? (
          <div>
            <p><strong>Address:</strong> {location.display_name}</p>
            <p><strong>District:</strong> {district}</p>
            <p><strong>Postal Code (PIN):</strong> {postalCode}</p>

            <div style={{ height: "300px", marginTop: "1.5rem", borderRadius: "12px", overflow: "hidden" }}>
              <MapContainer
                center={[location.lat, location.lon]}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.lat, location.lon]}>
                  <Popup>You are here</Popup>
                </Marker>
                {/* 🔁 Re-center the map when location changes */}
                <RecenterMap lat={location.lat} lon={location.lon} />
              </MapContainer>
            </div>

            <h2>Weather Info</h2>
            {weatherError && <p className="error">{weatherError}</p>}
            {weather ? (
              <div>
                <p><strong>Temperature:</strong> {weather.main.temp}°C</p>
                <p><strong>Weather:</strong> {weather.weather[0].description}</p>
                <p><strong>Humidity:</strong> {weather.main.humidity}%</p>
                <p><strong>Wind:</strong> {weather.wind.speed} m/s</p>
              </div>
            ) : (
              !weatherError && <p>Loading weather data...</p>
            )}

            <h2>Air Quality Index (AQI)</h2>
            {pollutionError && <p className="error">{pollutionError}</p>}
            {pollution ? (
              <div>
                <p><strong>OpenWeatherMap AQI (1–5 scale):</strong> {pollution.list[0].main.aqi}</p>
                <p><strong>Detailed AQI (based on PM2.5):</strong> {detailedAQI} ({getAQICategory(detailedAQI)})</p>
                <p><strong>PM2.5 concentration:</strong> {pollution.list[0].components.pm2_5} µg/m³</p>
                <p><strong>PM10 concentration:</strong> {pollution.list[0].components.pm10} µg/m³</p>
              </div>
            ) : (
              !pollutionError && <p>Loading air pollution data...</p>
            )}
          </div>
        ) : (
          !error && <p>Loading your location info...</p>
        )}
      </div>
    </>
  );
}

export default App;

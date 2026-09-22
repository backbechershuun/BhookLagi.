import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import RestaurantList from "./pages/RestaurantList.jsx";
import RestaurantDetail from "./pages/RestaurantDetail.jsx";
import FoodMenu from "./pages/FoodMenu1.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import MyRestaurants from "./pages/MyRestaurants.jsx";
import AddRestaurant from "./pages/AddRestaurant.jsx";
import RestaurantManage from "./pages/RestaurantManage.jsx";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<RestaurantList />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/restaurants/:id/menu" element={<FoodMenu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute ownerOnly>
              <MyRestaurants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/restaurants/new"
          element={
            <ProtectedRoute ownerOnly>
              <AddRestaurant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/restaurants/:id/manage"
          element={
            <ProtectedRoute ownerOnly>
              <RestaurantManage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
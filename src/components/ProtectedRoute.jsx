import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children, ownerOnly = false }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (ownerOnly && user.role !== "owner") return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;

import { createContext, useContext, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

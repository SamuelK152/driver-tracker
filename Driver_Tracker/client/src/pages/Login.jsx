import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../lib/apiClient";
import AuthForm from "../lib/AuthForm";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/api/auth/login", formData);
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Invalid credentials";
      alert(message);
    }
  };

  const fields = [
    {
      name: "username",
      type: "text",
      placeholder: "Username",
      value: formData.username,
      onChange: (e) => setFormData({ ...formData, username: e.target.value }),
      required: true,
    },
    {
      name: "password",
      type: "password",
      placeholder: "Password",
      value: formData.password,
      onChange: (e) => setFormData({ ...formData, password: e.target.value }),
      required: true,
    },
  ];

  return (
    <AuthForm
      title="Login"
      fields={fields}
      submitLabel="Login"
      onSubmit={handleSubmit}
      footerText="Don't have an account?"
      footerLinkText="Register"
      footerLinkTo="/register"
    />
  );
};

export default Login;

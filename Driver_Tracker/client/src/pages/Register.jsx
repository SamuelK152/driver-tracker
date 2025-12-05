import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../lib/apiClient";
import AuthForm from "../lib/AuthForm";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/auth/register", formData);
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Error registering user";
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
      title="Register"
      fields={fields}
      submitLabel="Register"
      onSubmit={handleSubmit}
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkTo="/login"
    />
  );
};

export default Register;

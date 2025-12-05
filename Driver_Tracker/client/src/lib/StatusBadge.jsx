const styles = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-gray-100 text-gray-800",
};

const StatusBadge = ({ label, variant = "neutral" }) => {
  return (
    <span
      className={`px-2 py-1 rounded text-sm ${
        styles[variant] || styles.neutral
      }`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

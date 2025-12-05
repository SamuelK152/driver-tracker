import { Link } from "react-router-dom";

const AuthForm = ({
  title,
  fields,
  submitLabel,
  onSubmit,
  footerText,
  footerLinkText,
  footerLinkTo,
}) => {
  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold">{title}</h2>
        {fields.map((field) => (
          <input
            key={field.name}
            type={field.type}
            placeholder={field.placeholder}
            className="w-full p-2 mb-4 border rounded"
            value={field.value}
            onChange={field.onChange}
            required={field.required}
          />
        ))}
        <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          {submitLabel}
        </button>
        {footerText && footerLinkText && footerLinkTo && (
          <p className="mt-4 text-center">
            {footerText}{" "}
            <Link to={footerLinkTo} className="text-blue-500">
              {footerLinkText}
            </Link>
          </p>
        )}
      </form>
    </div>
  );
};

export default AuthForm;

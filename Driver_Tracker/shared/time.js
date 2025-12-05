export const timeRegex = /^\d{1,2}:\d{2}(?::\d{2})?\s*(AM|PM)?$/i;

export const isValidTimeString = (value) => {
  if (!value || typeof value !== "string") return false;
  if (value === "-") return true; // treat placeholder as okay
  return timeRegex.test(value.trim());
};

export const findInvalidTimeFields = (rows, fields) => {
  const errors = [];
  rows.forEach((row, index) => {
    fields.forEach((field) => {
      const val = row[field];
      if (val && typeof val === "string" && !isValidTimeString(val)) {
        errors.push({ rowIndex: index, field, driverName: row["Driver name"] });
      }
    });
  });
  return errors;
};

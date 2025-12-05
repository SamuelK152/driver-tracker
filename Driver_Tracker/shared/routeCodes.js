export const hasMultipleRoutes = (routeCode) => {
    return typeof routeCode === "string" && routeCode.includes("|");
};

export const collectClaimedRoutes = (rows, key = "Route code") => {
    const claimed = new Set();
    rows.forEach((row) => {
        const routeCode = row[key];
        if (typeof routeCode === "string" && routeCode.trim() && !hasMultipleRoutes(routeCode)) {
            claimed.add(routeCode.trim());
        }
    });
    return claimed;
};

export const normalizeRouteCode = (routeCode, claimedRoutes = new Set()) => {
    if (!hasMultipleRoutes(routeCode)) return routeCode;
    const codes = routeCode.split("|").map((c) => c.trim()).filter(Boolean);
    const remaining = codes.filter((code) => !claimedRoutes.has(code));
    if (remaining.length === 0) return "RESCUE";
    return remaining.join("|");
};

export const validateRouteCodes = (rows, key = "Route code", nameKey = "Driver name") => {
    const errors = [];
    rows.forEach((row, index) => {
        const routeCode = row[key];
        if (hasMultipleRoutes(routeCode)) {
            errors.push({
                rowIndex: index,
                field: key,
                driverName: row[nameKey] || row["Driver Name"] || "Unknown",
            });
        }
    });
    return errors;
};

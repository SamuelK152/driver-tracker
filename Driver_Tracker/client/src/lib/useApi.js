import { useState, useCallback } from "react";
import apiClient from "./apiClient";

const getErrorMessage = (error) => {
    return error.response?.data?.message || error.message || "Request failed";
};

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (config) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient(config);
            return res.data;
        } catch (err) {
            setError(getErrorMessage(err));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const get = useCallback((url, config = {}) => request({ url, method: "get", ...config }), [request]);
    const post = useCallback((url, data, config = {}) => request({ url, method: "post", data, ...config }), [request]);
    const put = useCallback((url, data, config = {}) => request({ url, method: "put", data, ...config }), [request]);
    const del = useCallback((url, config = {}) => request({ url, method: "delete", ...config }), [request]);

    return { request, get, post, put, del, loading, error };
};

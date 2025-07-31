import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:8000", // or 127.0.0.1
});

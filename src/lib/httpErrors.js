export class ApiError extends Error {
  constructor({ message, status, code, details, url }) {
    super(message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}


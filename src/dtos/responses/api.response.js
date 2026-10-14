class ApiResponse {
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (meta !== null && meta !== undefined) {
      this.meta = meta;
    }
    this.timestamp = new Date().toISOString();
  }

  static success(message, data = null, meta = null) {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message, errors = null) {
    const response = new ApiResponse(false, message);
    if (errors !== null && errors !== undefined) {
      response.errors = errors;
    }
    return response;
  }
}

module.exports = ApiResponse;

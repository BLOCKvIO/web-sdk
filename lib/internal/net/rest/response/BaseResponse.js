
export default class BaseResponse {

  constructor(error, message, payload, status) {
    this.status = status;
    this.error = error;
    this.message = message;
    this.payload = payload;
  }
}
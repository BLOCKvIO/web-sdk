export default class LoginRequest {

    constructor(tokenType, token, password) {
        this.token_type = tokenType;
        this.token = token;
        this.auth_data = { password: password };
    }

    get tokenType() {
        return this.token_type;
    }

    set tokenType(tokenType) {
        this.token_type = tokenType;
    }

}
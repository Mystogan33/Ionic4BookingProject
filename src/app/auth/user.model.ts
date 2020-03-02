export class User {
  constructor(
    public id: string,
    public email: string,
    private _token: string,
    private tokenExpirationDate: Date
  ) {}

  get token() {
    if(!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()) {
      return null;
    }
    return this._token;
  }

  get tokenDuration() {
    return this.token ?
      this.tokenExpirationDate.getTime() - new Date().getTime()
      : 0;
  }
}

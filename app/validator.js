const hmac = require("crypto-js/hmac-sha1");
const username = process.env['username']
const password = process.env['password']

const username2 = process.env['username2']
const password2 = process.env['password2']


class Validator {
    constructor(user, data, signature) {
        this.user = user;
        this.data = data;
        this.signature = signature;
    }

    validate() {
        return new Promise((resolve, reject) => {
          if(this.user == username && this.calculateSignature(password) == this.signature) {
            resolve();
          } else if (this.user == username2 && this.calculateSignature(password2) == this.signature) {
            resolve();
          } else {
            reject(`Invalid signature.`);
          }
        });
    }

    key() {
        return new Promise((resolve, reject) => {
            const filepath = path.normalize(path.join(__dirname, "..", "users", this.user));
            fs.readFile(filepath, {encoding: "utf-8"}, (error, data) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(data.trim())
                }
            })
        })
    }

    calculateSignature(key) {
        return hmac(this.data, key).toString();
    }
}

module.exports = Validator;
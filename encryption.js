// import crypto from "node:crypto"

// class Encryption {
//   static encrypt(data, key) {
//     const iv = crypto.randomBytes(12);
//     const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
//     let encryptedData = cipher.update(data, "utf8", "base64");
//     encryptedData += cipher.final("base64");
//     const tag = cipher.getAuthTag();
//     return { iv, encryptedData, tag };
//   }

//   static decrypt(encryptedData, key, iv, tag) {
//     const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
//     decipher.setAuthTag(tag);
//     const decryptedData = decipher.update(encryptedData, "base64", "utf8") + decipher.final("utf8");
//     return decryptedData;
//   }
// }

// export default Encryption;

import CryptoJS from "crypto-js";

class Encryption {
  static encrypt(data, key) {
    const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes for AES
    const encryptedData = CryptoJS.AES.encrypt(data, key, { iv });
    return { iv: iv.toString(CryptoJS.enc.Base64), encryptedData: encryptedData.toString() };
  }

  static decrypt(encryptedData, key, iv) {
    console.log("here????")
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, key, { iv });
    return decryptedData.toString(CryptoJS.enc.Utf8);
  }
}

export default Encryption;

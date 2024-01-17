import CryptoJS from "crypto-js";

class Encryption {
  static encrypt(data, key) {
    const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes for AES
    const encryptedData = CryptoJS.AES.encrypt(data, key, { iv });
    return { iv: iv.toString(CryptoJS.enc.Base64), encryptedData: encryptedData.toString() };
  }

  static decrypt(encryptedData, key, iv) {
    console.log("here????");
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, key, { iv });
    return decryptedData.toString(CryptoJS.enc.Utf8);
  }
}

export default Encryption;

import Encryption from "./encryption.js";
import axios from "axios";
import CryptoJS from "crypto-js";
let serverSecret = "thisisMySecret";
let frontendSecret = "thisisMySecret";
let endPoints = ["a@b.com"];
let serverURL = "http://localhost:4000/";
let clientKey = CryptoJS.SHA256(frontendSecret);
clientKey = CryptoJS.enc.Base64.stringify(clientKey).slice(0, 32);
console.log("🔥  clientKey: ", clientKey);

export const initializeBackend = (backendSecret, URLs) => {
  serverSecret = backendSecret;
  endPoints = URLs;
  console.log("backendSecret : ", backendSecret, "urls : ", endPoints);
};

export const intializeFrontend = (serverUrl, ctx, src, frontendSecret) => {
  serverURL = serverUrl;
};

export const encryptDataAndSendtoServer = async (data) => {
  // signature
  const hmacSignature = CryptoJS.HmacSHA256(data, frontendSecret);
  // Convert the HMAC signature to a base64-encoded string
  const base64HmacSignature = CryptoJS.enc.Base64.stringify(hmacSignature);
  const dataWithSignature = data + ", sign:" + base64HmacSignature;

  // encryption
  const { iv, encryptedData } = Encryption.encrypt(dataWithSignature, clientKey);
  console.log("🔥  encryptedData: ", encryptedData);
  try {
    const response = await axios.post(serverURL, { encryptedData: encryptedData, iv: iv});
    const data = response.data;
    console.log("🔥  data: ", data);
  } catch (err) {
    console.log("error in sending encryptdata to server: ", err);
  }
};

export const decryptData = (encryptedData, iv) => {
  // TODO: update clientKey with serverKey later
  let plaintext = Encryption.decrypt(encryptedData, clientKey, iv);

  console.log("🔥  plaintext :", plaintext);

  return plaintext.split(", sign:")[0];
};

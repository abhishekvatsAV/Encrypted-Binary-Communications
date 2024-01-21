import Encryption from "./encryption.js";
import axios from "axios";
import CryptoJS from "crypto-js";
import cbor from "cbor-js";

let serverSecret = "thisisMySecret";
let frontendSecret = "thisisMySecret";
let endPoints = ["http://localhost:4000/", "http://localhost:4000/", "http://localhost:4000/", "http://localhost:4000/"];
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
  frontendSecret = frontendSecret;
};

function shardCbor(data, maxSize) {
  const cborEncodedData = cbor.encode(data);
  console.log("🔥  cborEncodedData: ", cborEncodedData);

  // Convert ArrayBuffer to Uint8Array and then to Array
  const cborArray = Array.from(new Uint8Array(cborEncodedData));

  const shards = [];
  let currentIndex = 0;

  while (currentIndex < cborArray.length) {
    const chunk = cborArray.slice(currentIndex, currentIndex + maxSize);
    shards.push(chunk);
    currentIndex += maxSize;
  }

  console.log("🔥  shards: ", shards);
  return shards;
}

export const encryptDataAndSendtoServer = async (ctx, req, endpoint, state, data) => {
  const maxSize = 100 * 1024; // 100KB
  const dataShards = shardCbor(data, maxSize);

  console.log("dataShards: ", dataShards);
  const url = endPoints[ctx]; // Use ctx as the index


  if (state === 0) {
    try {
      const message = {
        data: dataShards[0]?.toString(),
        ctx: ctx,
        req: req,
        endpoint: endpoint,
      };
      const response = await axios.post(url, { data: JSON.stringify(message), state: state });
      const responseData = response.data;
      console.log(`🔥  Response from ${url}: `, responseData);
    } catch (err) {
      console.log(`Error in sending the data to ${url} : `, err);
    }
  } else if (state === 1) {
    try {
      const { iv, encryptedData } = Encryption.encrypt(JSON.stringify(dataShards[0]), clientKey);
      let message = {
        data: encryptedData,
        iv: iv,
        ctx: ctx,
        req: req,
        endpoint: endpoint,
      };

      const response = await axios.post(url, { data: JSON.stringify(message), state: state });
      const responseData = response.data;
      console.log(`🔥  Response from ${url}: `, responseData);
    } catch (err) {
      console.log(`Error in sending the data to ${url} : `, err);
    }
  } else if (state === 2) {
    try {
      // TODO maybe convert the dataShards to json string
      const hmacSignature = CryptoJS.HmacSHA256(dataShards[0], frontendSecret);
      const base64HmacSignature = CryptoJS.enc.Base64.stringify(hmacSignature);

      const signData = {
        data: dataShards[0]?.toString(), // Convert shard to string
        signature: base64HmacSignature,
        ctx: ctx,
        req: req,
        endpoint: endpoint,
      };

      const response = await axios.post(url, { data: JSON.stringify(signData), state: state });
      const responseData = response.data;
      console.log(`🔥  Response from ${url}: `, responseData);
    } catch (err) {
      console.log(`Error in sending the data to ${url} : `, err);
    }
  } else if (state === 3) {
    try {
      const promises = dataShards.map(async (shard) => {
        try {
          // Encryption for the structured data
          const { iv, encryptedData } = Encryption.encrypt(JSON.stringify(shard), clientKey);

          const message = {
            data: encryptedData,
            iv: iv,
            ctx: ctx,
            req: req,
            endpoint: endpoint,
          };

          const response = await axios.post(url, { data: JSON.stringify(message), state: state });
          const responseData = response.data;
          console.log(`🔥  Response from ${url}: `, responseData);
          return responseData;
        } catch (err) {
          console.log(`Error in sending encrypted shard to ${url}: `, err);
          throw err;
        }
      });

      try {
        const responses = await Promise.all(promises);
        console.log("🔥  All responses: ", responses);
      } catch (err) {
        console.log("🔥  Error in sending encrypted shards: ", err);
        throw err;
      }
    } catch (err) {
      console.log(`Error in sending the data to ${url} : `, err);
    }
  } else {
    try {
      const promises = dataShards.map(async (shard) => {
        try {
          // TODO maybe convert the dataShards to json string
          const hmacSignature = CryptoJS.HmacSHA256(shard, frontendSecret);
          const base64HmacSignature = CryptoJS.enc.Base64.stringify(hmacSignature);

          const signData = {
            data: shard?.toString(),
            signature: base64HmacSignature,
            ctx: ctx,
            req: req,
            endpoint: endpoint,
          };

          const response = await axios.post(url, { data: JSON.stringify(signData), state: state });
          const responseData = response.data;
          console.log(`🔥  Response from ${url}: `, responseData);
          return responseData;
        } catch (err) {
          console.log(`Error in sending encrypted shard to ${url}: `, err);
          throw err;
        }
      });

      try {
        const responses = await Promise.all(promises);
        console.log("🔥  All responses: ", responses);
      } catch (err) {
        console.log("🔥  Error in sending encrypted shards: ", err);
        throw err;
      }
    } catch (err) {
      console.log(`Error in sending the data to ${url} : `, err);
    }
  }
};

export const decryptData = (encryptedData, iv) => {
  // TODO: update clientKey with serverKey later
  let plaintext = Encryption.decrypt(encryptedData, clientKey, iv);

  console.log("🔥  plaintext :", plaintext);

  return plaintext.split(", sign:")[0];
};

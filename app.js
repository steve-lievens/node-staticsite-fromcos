("use strict");
// --------------------------------------------------------------------------
// Require statements
// --------------------------------------------------------------------------
const express = require("express");
const path = require("path");
const request = require("request");
const ibmcos = require("ibm-cos-sdk");

// --------------------------------------------------------------------------
// Read environment variables
// --------------------------------------------------------------------------

// When not present in the system environment variables, dotenv will take them
// from the local file
require("dotenv-defaults").config({
  path: "my.env",
  encoding: "utf8",
  defaults: "my.env.defaults",
});

// IBM COS ENV
let COS_READY = true;
const COS_ENDPOINT = process.env.COS_ENDPOINT;
const COS_APIKEY = process.env.COS_APIKEY;
const COS_HMAC_ACCESS = process.env.COS_HMAC_ACCESS;
const COS_HMAC_SECRET = process.env.COS_HMAC_SECRET;
const COS_RES_INST_ID = process.env.COS_ENDPOINT;
const COS_BUCKET = process.env.COS_BUCKET;

// --------------------------------------------------------------------------
// Initialization App Logging
// --------------------------------------------------------------------------
console.log("INFO: Here we go ! Starting up the app !!!");

// --------------------------------------------------------------------------
// Initialization IBM COS
// --------------------------------------------------------------------------
if (
  COS_APIKEY === "" ||
  COS_ENDPOINT === "" ||
  COS_RES_INST_ID === "" ||
  COS_HMAC_ACCESS === "" ||
  COS_HMAC_SECRET === "" ||
  COS_BUCKET === ""
) {
  console.error(
    "ERROR: Missing environment variables. Please check or create the my.env file."
  );
  COS_READY = false;
}
const config = {
  endpoint: COS_ENDPOINT,
  apiKeyId: COS_APIKEY,
  ibmAuthEndpoint: "https://iam.ng.bluemix.net/oidc/token",
  serviceInstanceId: COS_RES_INST_ID,
  // these two are required to generate presigned URLs
  credentials: new ibmcos.Credentials(
    COS_HMAC_ACCESS,
    COS_HMAC_SECRET,
    (sessionToken = null)
  ),
  signatureVersion: "v4",
};

var cos = new ibmcos.S3(config);

// --------------------------------------------------------------------------
// Setup the express server
// --------------------------------------------------------------------------
const app = express();

// create application/json parser
// limit was raised to support large post bodies coming in
app.use(express.json({ limit: "50mb" })); // to support JSON-encoded bodies
app.use(express.urlencoded({ limit: "50mb", extended: true })); // to support URL-encoded bodies

// --------------------------------------------------------------------------
// Express Server runtime
// --------------------------------------------------------------------------
// Start our server !
app.listen(process.env.PORT || 8080, function () {
  console.log("INFO: app is listening on port %s", process.env.PORT || 8080);
});

// --------------------------------------------------------------------------
// Static Content : also map the root dir to the static folder and paths used by React frontend
// --------------------------------------------------------------------------
app.get("/*", (req, res) => {
  // If COS not ready, get out
  if (!COS_READY) {
    res.end("ERROR: COS not ready. Setup the environment variables.");
    return;
  }

  // Get the static file path
  const staticFilePath = req.url.replace("/", "");
  console.log("INFO: Static file requested : ", staticFilePath);

  // When the path is empty, redirect to the index.html
  if (staticFilePath == "") {
    res.redirect("/index.html");
  } else {
    proxyCOSObject(staticFilePath, res); // Serve the static file
  }
});

// --------------------------------------------------------------------------
// REST API : proxy a COS object using the presigned url
// --------------------------------------------------------------------------
async function proxyCOSObject(staticFilePath, res) {
  console.log("INFO: Proxying COS object : ", staticFilePath);
  // Get the query parameters
  //const cosFilename = req.query.filename;
  if (staticFilePath) {
    console.log("INFO: requested filename : ", staticFilePath);

    const url = await cos.getSignedUrl("getObject", {
      Bucket: COS_BUCKET,
      Key: staticFilePath,
      Expires: 60, // 1 minute
    });
    console.log("INFO: Retrieved the signed url ...");
    //console.log("INFO:", url);
    console.log(
      "INFO: Downloading the file with the signed url and proxying ..."
    );
    request.get(url).on("response", function (response) {
      var chunks = [];
      response.on("data", function (chunk) {
        chunks.push(chunk);
      });

      response.on("end", function () {
        var finalData = new Buffer.concat(chunks);

        res.type("text/html");
        //res.end(finalData, "binary");
        res.end(finalData);
        console.log("INFO: File returned to the browser.");
      });
    });
  } else {
    console.log("WARNING: filename query parameter not provided.");
    res.end();
  }
}

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// Helper functions
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// Helper : Get the content of a COS bucket
// --------------------------------------------------------------------------
async function getBucketContents(bucketName) {
  console.log(`Retrieving bucket contents from: ${bucketName}`);
  return cos
    .listObjects({ Bucket: bucketName })
    .promise()
    .then((data) => {
      if (data != null && data.Contents != null) {
        for (var i = 0; i < data.Contents.length; i++) {
          var itemKey = data.Contents[i].Key;
          var itemSize = data.Contents[i].Size;
          console.log(`Item: ${itemKey} (${itemSize} bytes).`);
        }
      }
    })
    .catch((e) => {
      console.error(`ERROR: ${e.code} - ${e.message}\n`);
    });
}

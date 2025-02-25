# Static site Server

This app provides allows you to host a static website using html files which are hosted in a non public Cloud Object Storage bucket.

Make sure you have access to an IBM Cloud Object Storage bucket and obtain the necessary service credentials (including HMAC credentials).
Accessing the hostname (and therefor the root) of the application will redirect to "index.html" as a starting point, so make sure this file is present in your bucket.
You can of course use a different filename for your html file, but then you need to explicitly add it to the hostname of the application (e.g. http://localhost:3000/test.html)

To use it, clone or download this git repo.

Copy and rename the my.env.defaults file to my.env and fill in the values :

- PORT : port on which the application will listen.
- COS_ENDPOINT is the api endpoint for your bucket. This will depend on the location of the bucket and network connectivity (public or private). You can find the info here :
  https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-endpoints
  (As an example, the my.env.defaults file contains the endpoint for a regional bucket in Frankfurt on the public network.)
- COS_APIKEY is the api key. You can find it in the service credentials object as "apikey".
- COS_HMAC_ACCESS is the HMAC access key. You can find it in the service credentials object as "cos_hmac_keys.access_key_id".
- COS_HMAC_SECRET is the HMAC secret. You can find it in the service credentials object as "cos_hmac_keys.secret_access_key".
- COS_RES_INST_ID is the resource instance id. You can find it in the service credentials object as "resource_instance_id".
- COS_BUCKET is the name of the bucket where your static resources are located (like the index.html file).

Now you can run the application locally. It was created and tested with Node.js v22, so best to use this.

```
node app.js
```

If you wish to deploy this on IBM Cloud Code Engine, here are two ways to do this :

- Create a container image locally, push it to your registry and deploy on Code Engine using this registry image.
- Deploy directly from the git repo, letting Code Engine build the image, store it and deploy it.

In both options, the environment variables will be pushed into a ConfigMap which will then be attached to the container.

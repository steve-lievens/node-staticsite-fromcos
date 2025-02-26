# Deploy to Code Engine with a locally built image

When choosing this route, I presume you have the knowledge to build container images, so no instructions are provided for this step.

If you've successfully built a local image (with x86 architecture, so watch out Mac Silicon users), you can push your image to the IBM Cloud image registry. (Or another one of your choosing, but info is provided for IBM Cloud)

(Tip to build x86 containers on Apple Silicon : docker build --platform linux/amd64 --load -t node-static-site:1.0 .)

After that it's easy to deploy it to Code Engine.

Make sure you have the ibmcloud cli
(instructions here : https://cloud.ibm.com/docs/cli?topic=cli-getting-started)
with the container registry plugin installed.

To check if you have it :

```
ibmcloud plugin list
```

To install :

```
ibmcloud plugin install container-registry -r 'IBM Cloud'
```

To update :

```
ibmcloud plugin update cr
```

Login to the ibmcloud cli :
(This will ask you to launch the browser to authenticate. You get a token back to fill in. After that you can choose the correct IBM Cloud account)

```
ibmcloud login -sso
```

Select the correct resource group

```
ibmcloud target -g RESOURCE_GROUP
```

Select the correct region (like eu-de or us-south)

```
ibmcloud target -r REGION
```

Ensure that you're targeting the correct IBM Cloud Container Registry region.(like eu-de or us-south)

```
ibmcloud cr region-set REGION
```

Take a note of the registry hostname (e.g. de.icr.io)
Now you can login to the registry : (it will use your IBM Cloud authentication, so no need to provide extra credentials)

```
ibmcloud cr login
```

Tag your local image and make sure it's prefixed with the registry hostname you took a note of above.
Also provide a registry namespace you want to use for this image.

```
docker tag <your-local-image-name> <registry-hostname>/<your-namespace>/<your-image-name>:<my_tag>
```

Now push the image :

```
docker push <registry-hostname>/<your-namespace>/<your-image-name>:<my_tag>
```

Depending on the size, this could take a while
If you want to verify, this is how to do that :

```
ibmcloud cr image-list
```

Now that are image is available in a registry, we can move to Code Engine to deploy it. This will require the code-engine/ce plugin in the ibmcloud cli.

```
ibmcloud plugin install ce
```

First step now it to select your Code Engine project. If you don't have one, jump into the IBM Cloud portal and create one through the UI.
This step also requires that your IBM Cloud cli is set on the correct region and resource group. So if you haven't done the steps above, make sure these two are set correctly.

```
ibmcloud code-engine project select --name <your-project>
```

The next step requires you to have an IBM api key. If you don't have one, head over to the IAM section in IBM Cloud and create an api key in the account.
With the api key, we configure the access to the above IBM Cloud registry, so that Code Engine can get to the image.

```
ibmcloud ce secret create --format registry --name <myregistry> --server <registry-hostname> --username iamapikey --password <APIKEY>
```

Next we create a configmap that holds our application configuration from the environment file we created (my.env)

```
ibmcloud ce configmap create --name static-site-cfg --from-env-file my.env
```

Now we can deploy our app. In the command below, the app name is free to choose, the image name is the same as the tag you gave your local image and the registry-secret is the one created above.
We're also referencing the configmap created above to pass the configuration into the container as environment variables.

```
ibmcloud ce app create --name <myapp> --image <your-image-name> --registry-secret <myregistry> --env-from-configmap static-site-cfg
```

This will deploy the app with 1vCPU and 4GB ram (which are the defaults)

Other parameters you might want to add are :

- --min-scale 1 : to always keep at least 1 container running (so no more serverless behaviour)
- --cpu 0.125 : set the desired cpu
- --memory 0.5G : set the desired memory

For cpu and memory, adhere to the supported cpu/memory combinations.
https://cloud.ibm.com/docs/codeengine?topic=codeengine-mem-cpu-combo

If you want to change any values after application creation, use

```
ibmcloud ce app update
```

instead.

# Deploy to Code Engine with a locally built image

If you've successfully built a local image (with x86 architecture, so watch out Mac users), you can push your image to the IBM Cloud image registry.
After that it's easy to deploy it to Code Engine.

Make sure you have the ibmcloud cli with the container registry plugin installed :

```
ibmcloud plugin install container-registry -r 'IBM Cloud'
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

Take a note of the registry hostname (e.g. us.icr.io)
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

Now we can deploy our app. In the command below, the app name is free to choose, the image name is the same as the tag you gave your local image and the registry-secret is the one created above.

```
ibmcloud ce app create --name <myapp> --image <your-image-name> --registry-secret <myregistry>
```

This will deploy the app with 1vCPU and 4GB ram (which are the defaults)

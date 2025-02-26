# Deploy to Code Engine from the Git repo

Using this procedure, IBM Code Engine will build the image for you and store it in an image registry. (So you will also need write access to an image registry)
Instructions are provided when using the IBM Cloud registry, but feel free to use your own when you have one.
After that it's easy to deploy it to Code Engine.

Make sure you have the ibmcloud cli
(instructions here : https://cloud.ibm.com/docs/cli?topic=cli-getting-started)
The code-engine/ce plugin in the ibmcloud cli is also needed. This can be installed using below command :

```
ibmcloud plugin install ce
```

Next, login to the ibmcloud cli :
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

First step now it to select your Code Engine project. If you don't have one, jump into the IBM Cloud portal and create one through the UI.

```
ibmcloud code-engine project select --name <your-project>
```

The next step requires you to have an IBM api key. If you don't have one, head over to the IAM section in IBM Cloud and create an api key in the account.
With the api key, we configure the access to the IBM Cloud registry, so that Code Engine can store the image. The api key needs to have write access to the below registry (or write access to at least one namespace in the registry).

```
ibmcloud ce secret create --format registry --name <myregistry> --server <registry-hostname> --username iamapikey --password <APIKEY>
```

Parameters are :

- myregistry : you can choose any name here. It will be used in below commands.
- registry-hostname : hostname of the registry. For IBM Cloud you can find the hostnames of the different regions [here](https://cloud.ibm.com/docs/Registry?topic=Registry-registry_overview#registry_regions_local)

With the registry configured, we can create the image by configuring a build. This will setup a build pipeline that pulls the code from the github repo, builds the image and stores it into the container registry. The below command creates a configuration for the build.

```
ibmcloud ce build create --name <build-config-name> --source https://github.com/steve-lievens/node-staticsite-fromcos --registry-secret <myregistry> --image <REGISTRY/NAMESPACE/REPOSITORY:TAG> --force
```

(The --force might be needed if you have restricted access on the registry and are forced to use a specific namespace. The build create command seems to try to create the namespace used above and when you don't have the authority to do that, the command fails.)
With the configuration created, we can now run the actual build.

```
ibmcloud ce buildrun submit --build <build-config-name> --name <build-config-run-name>
```

Although there a cli command to build it in one go, having a separate config and then running it allows you to re-run the build every time there's a git change.

Now we can deploy our app. In the command below, the app name is free to choose, the image name is the same as the tag you gave your local image and the registry-secret is the one created above.

```
ibmcloud ce app create --name <myapp> --image <your-image-name> --registry-secret <myregistry>
```

This will deploy the app with 1vCPU and 4GB ram (which are the defaults)

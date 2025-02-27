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

The above command might fail when the registry access is limited, please see the [troubleshooting section](CE-DEPLOY-TROUBLESHOOT.MD).

Next we create a configmap that holds our application configuration from the environment file we created (my.env). If you missed this step, it's in the main [README](README.MD). You need to have this file locally in the same folder as from where you're running the below command.

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

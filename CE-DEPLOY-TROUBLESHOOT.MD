# Code Engine Deployment troubleshooting

When using IBM Techzone, depending on the reservation type, you might have very restricted access to some of the components used. Restricted access to the IBM Cloud image registry is one of them and it seems to cause some issues.

## API key creation

A first issue is the ability to create an API key. This seems to have been restricted in some accounts, so that you can't do that anymore. Please note that a personal API key (so one that you created on your own user account, not on top of a service ID) is valid across all accounts. It holds your user identity and is independant of the account you're using it in. So if you have an API key you created before, and the account you created this key is still active (and therefor your key is still active too), it should also work in the account where you are using Code Engine and the IBM Cloud image registry.

## IBM Cloud Registry access limitation

In some techzone reservations you can have access to the IBM Cloud image registry and it will give you access in only one namespace.
When doing a build from Git in Code Engine, this seems to cause some issues.
For the "ibmcloud ce build create" command the --force option is needed.
But then the "ibmcloud ce buildrun submit" seems to fail as well from the CLI. If however, you go to the Code Engine user interface and navigate to the "Image builds menu" on the left side, then choose the "Image build" tab and select the build config you created via the cli, you are able to create (on the right side) the build run without an error. Strange but true (... at the time of writing, February 2025).

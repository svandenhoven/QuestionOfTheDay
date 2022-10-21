# ❓Questions of the day

This application creates a Teams App where you can have a question of the day inside a meeting. This will give a question of the day to kickstart your meeting and to get everyone engaged.

This application can be used in Teams and outside of Teams. In Teams the application will use LiveShare where the fluid framework service of Teams will be used. Outside Teams it will use your own Fluid Relay Service.

## 😎 How does it look?

If you add the application to teams it would look like this.

[!QOTD](./images/QOTD.png)

With the button you can go to next question of you do not like it, or go back to previous. You can go back to max 3 questions.

## 👌 Set it up

1. Copy "qotdfunctions/TokenProvider/local.settings.template.json" to qotdfunctions/TokenProvider/local.settings.json" and add the key of your FluidRelay Service in Azure.
1. Build and deploy the Azure Function that will be the token provider for the Azure Relay Service
1. Copy "client/src/questionList example.js" to "client/src/questionList.js" and add your own questions
1. Copy "client/src/app.config.template.js" to "client/src/app.config.js" and add your own configuration from your own FluidRelay service in Azure. Use the azure functions url for tokenProvierUrl
1. Build the client and deploy to a Azure Static Web Site
1. Change the configurationUrl in the client/manifest/manifest.json to the Azure Static Web Site
1. Create a zip for the manifest to be able to deploy in Teams
1. Deploy the manifest to Teams and add the Teams App to a meeting

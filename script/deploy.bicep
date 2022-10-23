param appName string = 'qotd'
param resourceLocation string = resourceGroup().location

module fluidrelay 'fluidrelay.bicep' = {
  name:'${appName}fr'
  params: {
    name: '${appName}${uniqueString(resourceGroup().id)}'
    location: resourceLocation
  }
}

module azurefunctions 'azurefunctions.bicep' = {
  name: '${appName}af'
  params: {
    appName: '${appName}${uniqueString(resourceGroup().id)}'
    location: resourceLocation
    appInsightsLocation: resourceLocation

  }
  dependsOn:[
    fluidrelay
  ]
}

module staticWebApp 'staticwebsite.bicep' = {
  name: '${appName}swa'
  params: {
    appName: '${appName}${uniqueString(resourceGroup().id)}'
    location: resourceLocation
  }
}

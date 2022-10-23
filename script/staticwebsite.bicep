param appName string
param location string = resourceGroup().location

resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: appName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'Custom'
    enterpriseGradeCdnStatus: 'Disabled'
  }
}


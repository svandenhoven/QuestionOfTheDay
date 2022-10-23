param name string
param location string = resourceGroup().location

resource fluidRelayServer 'Microsoft.FluidRelay/fluidRelayServers@2022-06-01' = {
  name: '${name}-fr'
  location: location
  identity: {
    type: 'None'
  }
  properties: {
    storagesku: 'standard'
    provisioningState: 'Succeeded'
  }
}


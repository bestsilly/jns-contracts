import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  // TODO: Change metadataHost
  let metadataHost =
    process.env.METADATA_HOST || 'ens-metadata-service.appspot.com'

  if (network.name === 'jfintestnet') {
    metadataHost = 'https://ens-metadata-service-411410.de.r.appspot.com'
  }

  const metadataUrl = `${metadataHost}/name/0x{id}`

  await deploy('StaticMetadataService', {
    from: deployer,
    args: [metadataUrl],
    log: true,
  })
}

func.id = 'metadata'
func.tags = ['wrapper', 'StaticMetadataService']
// technically not a dep, but we want to make sure it's deployed first for the consistent address
func.dependencies = ['BaseRegistrarImplementation']

export default func

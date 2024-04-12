import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers } from 'hardhat'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const jnsAdminArgs = {
    from: deployer,
    args: [
      process.env.RECIPIENT_ADMIN_ADDRESS || owner,
      process.env.ORACLE_ADMIN_ADDRESS || owner,
      process.env.NAME_MANAGER || owner,
      process.env.RECIPIENT_ADDRESS || owner,
      [0, 0, '39999900000000', '9999900000000', '299900000000'],
    ],
    log: true,
  }

  const jnsAdminContract = await deploy('JNSAdminContract', jnsAdminArgs)

  console.log(`Deployed JNSAdminContract to ${jnsAdminContract.address}`)

  let oracleAddress = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
  if (network.name !== 'mainnet') {
    const dummyOracle = await deploy('DummyOracle', {
      from: deployer,
      args: ['31536000'],
      log: true,
    })
    oracleAddress = dummyOracle.address
  }

  await deploy('ExponentialPremiumPriceOracle', {
    from: deployer,
    args: [jnsAdminContract.address, '100000000000000000000000000', 21],
    log: true,
  })

  console.log(`Updating Oracle Address to ${oracleAddress} in JNSAdminContract`)
  const jnsAdmin = await ethers.getContract('JNSAdminContract', owner)
  const tx = await jnsAdmin
    .connect(await ethers.getSigner(owner))
    .changeOracleAddress(oracleAddress)
  console.log(`Oracle address updated to ${oracleAddress}`)
  await tx.wait()

  const nameManagerDataStoreArgs = {
    from: deployer,
    args: [jnsAdminContract.address],
    log: true,
  }

  const nameManagerDataStore = await deploy(
    'NameManagerDataStore',
    nameManagerDataStoreArgs,
  )

  const nameManagerArgs = {
    from: deployer,
    args: [jnsAdminContract.address, nameManagerDataStore.address],
    log: true,
  }

  await deploy('NameManager', nameManagerArgs)
}

func.id = 'price-oracle'
func.tags = ['ethregistrar', 'ExponentialPremiumPriceOracle', 'DummyOracle']
func.dependencies = ['registry']

export default func

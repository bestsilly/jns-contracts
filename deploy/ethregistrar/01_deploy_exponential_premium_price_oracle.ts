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
      process.env.RECIPIENT_ADDRESS || owner,
    ],
    log: true,
  }

  const jnsAdminContract = await deploy('JNSAdminContract', jnsAdminArgs)

  console.log(`Deployed JNSAdminContract to ${jnsAdminContract.address}`)

  let oracleAddress = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
  if (network.name !== 'mainnet') {
    const dummyOracle = await deploy('DummyOracle', {
      from: deployer,
      args: ['160000000000'],
      log: true,
    })
    oracleAddress = dummyOracle.address
  }

  await deploy('ExponentialPremiumPriceOracle', {
    from: deployer,
    args: [
      jnsAdminContract.address,
      [0, 0, '20294266869609', '5073566717402', '158548959919'],
      '100000000000000000000000000',
      21,
    ],
    log: true,
  })

  console.log(`Updating Oracle Address to ${oracleAddress} in JNSAdminContract`)
  const jnsAdmin = await ethers.getContract('JNSAdminContract', owner)
  const tx = await jnsAdmin
    .connect(await ethers.getSigner(owner))
    .changeOracleAddress(oracleAddress)
  console.log(`Oracle address updated to ${oracleAddress}`)
  await tx.wait()
}

func.id = 'price-oracle'
func.tags = ['ethregistrar', 'ExponentialPremiumPriceOracle', 'DummyOracle']
func.dependencies = ['registry']

export default func

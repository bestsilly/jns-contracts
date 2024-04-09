//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "./IPriceOracle.sol";
import "./StringUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IJNSAdminContract} from "jns-admin-contract/contracts/IJNSAdminContract.sol";

interface AggregatorInterface {
    function latestAnswer() external view returns (int256);
}

// StablePriceOracle sets a price in USD, based on an oracle.
contract StablePriceOracle is IPriceOracle {
    using StringUtils for *;
    // JNS Admin Contract
    IJNSAdminContract public adminContract;

    event RentPriceChanged(uint256[] prices);

    constructor(IJNSAdminContract _adminContract) {
        adminContract = _adminContract;
    }

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view override returns (IPriceOracle.Price memory) {
        uint256 len = name.strlen();
        uint256 basePrice;

        if (len >= 5) {
            basePrice = adminContract.getRentPrices()[4] * duration;
        } else if (len == 4) {
            basePrice = adminContract.getRentPrices()[3] * duration;
        } else if (len == 3) {
            basePrice = adminContract.getRentPrices()[2] * duration;
        } else if (len == 2) {
            basePrice = adminContract.getRentPrices()[1] * duration;
        } else {
            basePrice = adminContract.getRentPrices()[0] * duration;
        }

        return
            IPriceOracle.Price({
                base: attoUSDToWei(basePrice),
                premium: attoUSDToWei(_premium(name, expires, duration))
            });
    }

    /**
     * @dev Returns the pricing premium in wei.
     */
    function premium(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view returns (uint256) {
        return attoUSDToWei(_premium(name, expires, duration));
    }

    /**
     * @dev Returns the pricing premium in internal base units.
     */
    function _premium(
        string memory name,
        uint256 expires,
        uint256 duration
    ) internal view virtual returns (uint256) {
        return 0;
    }

    function attoUSDToWei(uint256 amount) internal view returns (uint256) {
        AggregatorInterface usdOracle = AggregatorInterface(
            adminContract.oracleAddress()
        );
        uint256 ethPrice = uint256(usdOracle.latestAnswer());
        return (amount * 1e8) / ethPrice;
    }

    function weiToAttoUSD(uint256 amount) internal view returns (uint256) {
        AggregatorInterface usdOracle = AggregatorInterface(
            adminContract.oracleAddress()
        );
        uint256 ethPrice = uint256(usdOracle.latestAnswer());
        return (amount * ethPrice) / 1e8;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) public view virtual returns (bool) {
        return
            interfaceID == type(IERC165).interfaceId ||
            interfaceID == type(IPriceOracle).interfaceId;
    }
}

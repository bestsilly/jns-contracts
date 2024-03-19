//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "./IPriceOracle.sol";

interface IETHRegistrarController {
    struct RegistrationParams {
        string name;
        address owner;
        uint256 duration;
        bytes32 secret;
        address resolver;
        bytes[] data;
        bool reverseRecord;
        uint16 ownerControlledFuses;
    }

    function rentPrice(
        string memory,
        uint256
    ) external view returns (IPriceOracle.Price memory);

    function available(string memory) external returns (bool);

    function makeCommitment(
        RegistrationParams calldata
    ) external pure returns (bytes32);

    function commit(bytes32) external;

    function commitments(bytes32) external view returns (uint256);

    function registerWithId(
        RegistrationParams calldata,
        string calldata
    ) external payable;

    function register(
        RegistrationParams calldata
    )
        external
        payable
        returns (uint256 baseCost, uint256 premium, uint256 expires);

    function renew(string calldata, uint256) external payable;
}

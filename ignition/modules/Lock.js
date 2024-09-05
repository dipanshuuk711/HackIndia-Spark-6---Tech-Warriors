const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Define any default parameters (if needed)
const DEFAULT_LISTING_PRICE = ethers.utils.parseEther("0.025"); // 0.025 ETH

module.exports = buildModule("NFTMarketplaceModule", (m) => {
  // Get customizable parameters from the deployment environment or fallback to default
  const listingPrice = m.getParameter("listingPrice", DEFAULT_LISTING_PRICE);

  // Deploy the NFTMarketplace contract with the listingPrice (if required)
  const NFTMarketplace = m.contract("NFTMarketplace", [], {
    value: listingPrice,
  });

  // Return the deployed contract
  return { NFTMarketplace };
});

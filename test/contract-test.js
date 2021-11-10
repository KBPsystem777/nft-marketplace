const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function () {
    // Deploy the marketplace contract
    const Market = await ethers.getContractFactory("NFTMarket")
    const market = await Market.deploy()
    await market.deployed()
    const marketAddress = market.address

    // Deploying the NFT contract
    const ValyrianNFT = await ethers.getContractFactory("ValyrianNFT")
    const nft = await ValyrianNFT.deploy(marketAddress)
    await nft.deployed()
    const nftContractAddress = nft.address

    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    const auctionPrice = ethers.utils.parseUnits("1", "ether")

    // Create 2 sample tokens
    await nft.createToken("https;//www.token.com")
    await nft.createToken("https;//www.token2.com")

    // Put the 2 tokens for sale
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, {
      value: listingPrice,
    })
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, {
      value: listingPrice,
    })

    const [_, buyerAddress] = await ethers.getSigners()

    // Executing the sale of token to another user
    await market
      .connect(buyerAddress)
      .createMarketSale(nftContractAddress, 1, { value: auctionPrice })

    // Querying and returning the unsold items
    let items = await market.fetchMarketItems()

    items = await Promise.all(
      items.map(async (i) => {
        const tokenUri = await nft.tokenURI(i.tokenId)
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri,
        }
        return item
      })
    )
    console.log("items: ", items)
  })
})

import { useState } from "react"
import { ethers } from "ethers"
import { create as ipfsHttpClient } from "ipfs-http-client"
import { useRouter } from "next/router"
import Web3Modal from "web3modal"

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0")

import { nftaddress, nftmarketaddress } from "../config"

import NFT from "../artifacts/contracts/NFT.sol/ValyrianNFT.json"
import Market from "../artifacts/contracts/Market.sol/NFTMarket.json"

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    decription: "",
  })
  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0]
    try {
      const added = await client.add(file, {
        progess: (prog) => console.log(`received: ${prog}`),
      })
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
    } catch (error) {
      console.log("Error uploading file: ", error)
    }
  }
  async function createMarket() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    // Uploading to IPFS firs
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    })
    try {
      const added = await client.add(data)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      // Once file is uploaded, save the file URL in Polygon
      createSale(url)
    } catch (error) {
      console.log("Error uploading file: ", error)
    }
  }
  async function createSale(url) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    // Creating the item
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()
    const price = ethers.utils.parseUnits(formInput.price, "ether")

    // Listing the item for sale on the VLNT marketplace
    contact = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, {
      value: listingPrice,
    })
    await transaction.wait()
    router.push("/")
  }
  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          placeholder="Asset name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
      </div>
    </div>
  )
}

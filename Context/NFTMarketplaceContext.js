import React, {useState, useEffect, useContext} from 'react'
import web3Modal from 'web3modal';
import { ethers } from 'hardhat';
import Router from 'next/router'
import axios from 'axios';
import { create as ipfsHttpClient } from 'ipfs-http-client';

const client = ipfsHttpClient("http://ipfs.infura.io:5001/api/v0")


//INTERNAL IMPORT
import { NFTMarketplaceAddress, NFTMarketplaceABI } from './constants';

//FETCHING SMART CONTRACT
const fetchContract = (signerorProivder) => new ethers.Contract(NFTMarketplaceAddress, NFTMarketplaceABI, signerorProivder);

//CONNECTING WITH SMART CONTRACT
 const connectingWithSmartContract = async()=>{
    try {
        const web3Modal = new web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);
        return contract;
    } catch (error) {
        console.log("Something went worng while connecting with smart contract");
    }
 }

export const NFTMarketplaceContext = React.createContext();

 export const NFTMarketplaceProvider = ({children})=> {
    const titleData = 'Discover, collect, and sell NFTs';

    //USESTATE
    const [currentAccount, setCurrentAccount] = useState("");

    //CHECK IF WALLET IS CONNECTED
    const checkIfWalletConnected = async()=> {
        try {
            if(!window.ethereum) return console.log("Install MetaMask");

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            if (accounts.length) {
                setCurrentAccount(accounts[0]);
            }else {
                console.log("No Account Found");
            }   
            
            console.log(currentAccount);
        } catch (error) {
            console.log("Something wrong while connecting to wallet");
        }
    };
    useEffect(()=> {
        checkIfWalletConnected(); 
    },[]);

    //CONNECT WALLET FUNCTION
    const connectWallet = async()=>{
        try {
            if(!window.ethereum) return console.log("Install MetaMask");

            const accounts = await window.ethereum.request({ method: 'eth_requestAccount' });

            setCurrentAccount(accounts[0]);
            window.location.reload();
        } catch (error) {
            console.log("Something wrong while connecting to wallet");
        }};
    //---upload to ipfs functions
    
    const uploadToIPFS = async(file)=>{
        try {
           const added = await client.add({ content : file });
           const url = 'https://ipfs.infura.io/ipfs/${added.path}';
           return url;
        }
        catch (error) {
            console.log("Something wrong while uploading to IPFS");
        }
    };

//---CREATENFT FUNCTION
 const createNFT = async(fromInput, fileUrl, router)=> {
    
       const{name, description, price} = fromInput;

       if (!name || !description || !price || !fileUrl) 
        return console.log("Data Is Missing");

        const data = JSON.stringify({name, description, image:fileUrl});

        try {
            const added = await client.add(data);

            const url = 'http://ipfs.infura.io/ipfs/${added.path}'
            await createSale(url,price)

        } catch(error) {
            console.log("Error  while creating nft file")
        }

    } 

//--- createSale FUNCtion
 const createSale = async(url, formInputPrice,isReselling,id) => {
    try {

        const price = ethers.utils.parseUnits(formInputPrice,"ether");
        const contract = await connectingWithSmartContract()

        const listingprice = await contract.getlistingPrice();

        const transaction = !isReselling ? await contract.createToken(url,price,{
           value: listingprice.toString(),
       }) : await contract.reSellToken(url,price,{
        value : listingprice.toString(),
       });

       await transaction.wait();

    } catch(error) {
        console.log("Error while creating sale")
    }
 };

//--FETCHNFTS FUNCTIONS
   const  fetchNFTs = async ()=> {
    try {
        const provider = new ethers.providers.JsonRpcProvider();
        const contract = fetchContract(provider);

        const data = await contract.fetchMarketItem();
        //console.log(data)
        const items = await Promise.all(
            data.map(
                async({tokenId,seller,owner,price: unformattedPrice}) => {
                   const tokenURI = await contract.tokenURI(tokenId);
                   const {
                      data: {image,name,description},
                   } = await axios.get(tokenURI);
                   const price = ethers.utils.formatUnits(
                    unformattedPrice.toString(),
                    "ether"
                   );

                   return {
                     price,
                     tokenId: tokenId.toNumber(),
                     seller,
                     owner,
                     image,
                     name,
                     description,
                     tokenURI,
                   };
                }
            )
        );
        return items;

    } catch(error) {
        console.log("Error while fetching nfts");
    }

   
};


 const fetchMyNFTsOrListedNFTs = async(type) => {
    try{
        const contract = await connectingWithSmartContract();

        const data = type == "fetchItemsListed" ? await contract.fetchItemsListed() : await contract.fetchMyNFT();

        const items = await Promise.all(
            data.map(
                async ({tokenId,seller,owner,price: unformattedPrice}) => {
                 const tokenURI = await contract.tokenURI(tokenId);
                   const {
                      data: {image,name,description},
                   } = await axios.get(tokenURI);
                   const price = ethers.utils.formatUnits(
                      unformattedPrice.toString(),
                       "ether"
                    );

                   return {
                      price,
                     tokenId: tokenId.toNumber(),
                     seller,
                     owner,
                     image,
                     name,
                     description,
                     tokenURI,
                   };
                }
            
            )

        );
               
    }catch (error) { 
        console.log("Error while fetching listed NFTs")
    }
 };
       
    
 //---BUY NFTs Funcion
 const buyNFT = async(nft) => {
    try {
        const contract = await connectingWithSmartContract();
        const Price = ethers.utils.parseUnits(nft.price.toString(), "ether");

        const transaction = await contract.createMarketSale(nft.tokenId,{
            value:price,
        
        });
        await transaction.wait();
    } catch (error) {
      console.log("Error while buying NFT");
    }

 };

  return (
    <NFTMarketplaceContext.Provider value={{checkIfWalletConnected, connectWallet,uploadToIPFS, buyNFT,createNFT,createSale,fetchMyNFTsOrListedNFTs,fetchNFTs,currentAccount,titleData,}}>
        {children}
    </NFTMarketplaceContext.Provider>
   );
};
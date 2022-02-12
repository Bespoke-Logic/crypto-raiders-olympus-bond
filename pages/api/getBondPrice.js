const { useState, useEffect } = require("react");
import { createAlchemyWeb3 } from "@alch/alchemy-web3";
const CoinGecko = require("coingecko-api");
const CR_BOND_ABI = require("../../lib/contracts/crbond_abi.json");
const CR_SLP_ABI = require("../../lib/contracts/cr_slp_abi.json");

async function getBondPrice() {
  const httpsService = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
  const web3 = new createAlchemyWeb3(httpsService);
  var discount = 0;
  const DECIMALS = 100000000000000000;

  const bondContract = new web3.eth.Contract(
    CR_BOND_ABI,
    "0xee57F4C39CEfA70Ce8D07767136e5F40042CCa1b"
  );
  const slpContract = new web3.eth.Contract(
    CR_SLP_ABI,
    "0x2e7d6490526c7d7e2fdea5c6ec4b0d1b9f8b25b7"
  );

  // Use coingecko for fetching token prices
  const CoinGeckoClient = new CoinGecko();

  // The main calculation
  const getTrueBondPrice = bondContract.methods.trueBondPrice().call();
  const getSlpTotalSupply = slpContract.methods.totalSupply().call();
  const getSlpReserves = slpContract.methods.getReserves().call();

  const getCoinPrices = CoinGeckoClient.simple.price({
    ids: ["crypto-raiders", "matic-network"],
    vs_currencies: ["usd"],
  });

  // Fetch everything in parallel.
  const results = await Promise.all([
    getTrueBondPrice,
    getCoinPrices,
    getSlpTotalSupply,
    getSlpReserves,
  ]);

  const trueBondPrice = results[0] / 10000000;
  const maticPrice = results[1].data["matic-network"]["usd"];
  const raiderPrice = results[1].data["crypto-raiders"]["usd"];
  const slpTotalSupply = Number(results[2]) / DECIMALS;
  const slpMaticReserves = Number(results[3]["0"] / DECIMALS);
  const slpRaiderReserves = Number(results[3]["1"] / DECIMALS);
  const slpValue =
    slpMaticReserves * maticPrice + slpRaiderReserves * raiderPrice;
  const slpPrice = slpValue / slpTotalSupply;
  const bondPrice = slpPrice * trueBondPrice;
  discount = raiderPrice / bondPrice - 1;

  console.log("roi: ", discount);
  return { bondPrice, discount };
}

export default async function handler(req, res) {
  const results = await getBondPrice();
  res.status(200).json(results);
}

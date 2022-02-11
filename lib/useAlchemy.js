import { createAlchemyWeb3 } from "@alch/alchemy-web3";

export default function useCrRecruiting(apiKey) {
    const httpsService = `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;
    const web3 = new createAlchemyWeb3(httpsService);
    const useContract = (contractId, contractAbi) => {
        return new web3.eth.Contract(
            contractAbi,
            contractId
          );
    }
    return {useContract}
}
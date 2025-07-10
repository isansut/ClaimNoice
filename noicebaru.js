import { ethers } from "ethers";

const rpcUrl = "https://client.farcaster.xyz/8453/eth-rpc";
const pvkey = "PVKEYYYLOOOO";
const userAddress = "ADDRESSLOOOOO";
const contractAddress = "0xD77b09C658B48fdF303e83f8BB459b4e479Dcf84";

const tokenSymbol = "NOICE";
const amount = ethers.parseUnits("80", 18);

const apiBaseUrl = "https://play-omega-eight.vercel.app/api/get-signature";

async function mainLoop() {
  const provider = new ethers.JsonRpcProvider(rpcUrl, 8453);
  const wallet = new ethers.Wallet(pvkey, provider);

  const abi = [
    "function claimReward(uint256 amount, uint256 nonce, bytes signature)"
  ];
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  let counter = 1;

  while (true) {
    console.log(`\n======= Loop #${counter} =======`);

    // 1. Get signature
    const url = `${apiBaseUrl}?userAddress=${userAddress}&amount=${amount.toString()}&tokenSymbol=${tokenSymbol}`;
    console.log("Requesting signature from:", url);

    let res;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
        }
      });
    } catch (err) {
      console.error("❌ Network error:", err);
      continue;
    }

    if (!res.ok) {
      console.error("❌ Failed fetching signature:", res.status, res.statusText);
      continue;
    }

    const data = await res.json();
    console.log("✅ Signature Response:", data);

    // 2. Call contract
    try {
      const tx = await contract.claimReward(
        data.amount,
        data.nonce,
        data.signature
      );

      console.log("TX Hash:", tx.hash);

      const receipt = await tx.wait();
      console.log("✅ Claim success in block:", receipt.blockNumber);
    } catch (err) {
      console.error("❌ TX Error:", err);

      const errStr = JSON.stringify(err);
      if (errStr.includes("insufficient funds for intrinsic transaction cost")) {
        console.log("🔴 Stopping loop: insufficient funds for gas.");
        break;
      } else {
        console.log("⚠️ Will retry...");
      }
    }

    counter++;

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

mainLoop().catch(console.error);

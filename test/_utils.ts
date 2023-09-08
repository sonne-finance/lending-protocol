import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, network } from "hardhat";

const sumArray = (array: bigint[][]) => {
    const newArray: bigint[] = [];
    array.forEach((sub) => {
        sub.forEach((num: bigint, index: number) => {
            if (newArray[index]) {
                newArray[index] = newArray[index] + num;
            } else {
                newArray[index] = num;
            }
        });
    });
    return newArray;
};

const getTokenContract = async (opts: {
    admin: SignerWithAddress;
    mintAmount?: bigint;
    existingAddress?: string;
    whaleAddress?: string;
    decimals?: string;
}) => {
    if (opts.existingAddress) {
        const token = await ethers.getContractAt(
            "MockERC20Token",
            opts.existingAddress,
        );

        if (opts.whaleAddress) {
            const whale = await ethers.getSigner(opts.whaleAddress);

            const balance = await token.balanceOf(whale.address);
            await (
                await token.connect(whale).transfer(opts.admin.address, balance)
            ).wait(1);
        }

        return token;
    } else {
        const Token = await ethers.getContractFactory("MockERC20Token");
        const token = await Token.connect(opts.admin).deploy(
            opts.mintAmount || ethers.parseEther("100000000"),
            18,
        );
        return token;
    }
};

const getImpersonatedSigner = async (account: string) => {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [account],
    });

    const newBalanceHex = "0x" + ethers.parseEther("100").toString(16);
    await network.provider.request({
        method: "hardhat_setBalance",
        params: [account, newBalanceHex],
    });
    return ethers.getSigner(account);
};

function anyValue() {
    return true;
}

export { anyValue, getImpersonatedSigner, getTokenContract, sumArray };

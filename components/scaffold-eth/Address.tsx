"use client";

import { useState } from "react";
import { Address as AddressType, getAddress, isAddress } from "viem";
import { useEnsName } from "wagmi";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

type AddressProps = {
  address?: AddressType;
  disableAddressLink?: boolean;
  format?: "short" | "long";
  size?: "xs" | "sm" | "base" | "lg" | "xl";
};

const textSizeMap = {
  xs: "text-xs",
  sm: "text-sm", 
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
} as const;

export const Address = ({ address, disableAddressLink, format = "short", size = "base" }: AddressProps) => {
  const [addressCopied, setAddressCopied] = useState(false);

  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
  });

  // Skeleton UI
  if (!address) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 bg-slate-300 rounded w-28"></div>
        </div>
      </div>
    );
  }

  if (!isAddress(address)) {
    return <span className="text-error">Wrong address</span>;
  }

  const checksummedAddress = getAddress(address);
  
  let displayAddress = "";
  if (ensName) {
    displayAddress = ensName;
  } else if (format === "long") {
    displayAddress = checksummedAddress;
  } else {
    displayAddress = `${checksummedAddress.slice(0, 6)}...${checksummedAddress.slice(-4)}`;
  }

  const handleAddressCopy = () => {
    navigator.clipboard.writeText(checksummedAddress);
    setAddressCopied(true);
    setTimeout(() => {
      setAddressCopied(false);
    }, 800);
  };

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className={`w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600`}></div>
      </div>
      <span className={`ml-1.5 ${textSizeMap[size]} font-normal`}>
        {disableAddressLink ? (
          displayAddress
        ) : (
          <a
            className="hover:underline"
            href={`https://basescan.org/address/${checksummedAddress}`}
            target="_blank" 
            rel="noopener noreferrer"
          >
            {displayAddress}
          </a>
        )}
      </span>
      {addressCopied ? (
        <CheckCircleIcon
          className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
          aria-hidden="true"
        />
      ) : (
        <DocumentDuplicateIcon
          className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
          onClick={handleAddressCopy}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

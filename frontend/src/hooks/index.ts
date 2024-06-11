import { apiPost } from "@/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import base58 from "bs58";
import { useCallback, useEffect, useState } from "react";

export const useUserBalance = () => {
  const { connection } = useConnection();

  const { publicKey, connecting } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey && !connecting) {
      connection.getBalance(publicKey).then((balance) => setBalance(balance));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  return { balance };
};
export const useWalletAccount = () => {
  const [_address, setAddress] = useState<string | null>(null);

  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  useEffect(() => {
    if (address) {
      setAddress(address);
    } else {
      setAddress(null);
    }
  }, [address]);

  return { address: _address };
};
export function useCustomSign() {
  const { publicKey, signMessage } = useWallet();
  const [signed, setSigned] = useState(false);

  const signCustomMessage = async () => {
    if (!publicKey) return;
    const address = publicKey?.toBase58();
    const account = {
      address: address,
    };
    // const message = "Sign to provide access to app";
    const { message } = await apiPost<{ message: string }>(
      "/api/request-message",
      account
    );

    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = (await signMessage?.(encodedMessage)) as Uint8Array;
    const signature = base58.encode(signedMessage);
    setSigned(true);
    try {
      await verifyMessage({
        message,
        signature,
        address: address as string,
      });
    } catch (e) {
      console.log(e);
      return;
    }
    async function verifyMessage(options: {
      message: string;
      signature: any;
      address: string;
    }) {
      const response = await apiPost<{ verified: boolean }>(
        "/api/verify",
        options
      );
      setSigned(response.verified);
    }
  };
  const signMessageCb = useCallback(signCustomMessage, [signCustomMessage]);
  useEffect(() => {
    console.log({ signed });

    publicKey ? !signed && signMessageCb() : setSigned(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, signed]);
  return { signed, setSigned, signCustomMessage: signMessageCb };
}
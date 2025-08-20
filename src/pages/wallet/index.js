import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Web3Service from '../../hooks/index';
import "./index.css";

export default function Wallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [networkId, setNetworkId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Send transaction states
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  
  // Transaction history
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    try {
      if (Web3Service.isMetaMaskInstalled()) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const setupEventListeners = () => {
    // Listen for account changes
    Web3Service.onAccountChange((newAccount) => {
      if (newAccount) {
        setAccount(newAccount);
        refreshBalance();
        toast.info('Account changed');
      } else {
        disconnect();
        toast.warn('Account disconnected');
      }
    });

    // Listen for network changes
    Web3Service.onNetworkChange((newNetworkId) => {
      setNetworkId(newNetworkId);
      refreshBalance();
      toast.info(`Network changed to ${Web3Service.getNetworkName(newNetworkId)}`);
    });
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      if (!Web3Service.isMetaMaskInstalled()) {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      const result = await Web3Service.initWeb3();
      
      setIsConnected(true);
      setAccount(result.account);
      setNetworkId(result.networkId);
      
      await refreshBalance();
      
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error(`Failed to connect wallet: ${error.message}`);
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    Web3Service.disconnect();
    setIsConnected(false);
    setAccount('');
    setBalance('0');
    setNetworkId(null);
    setTransactions([]);
    toast.info('Wallet disconnected');
  };

  const refreshBalance = async () => {
    try {
      if (!isConnected) return;
      
      const balanceData = await Web3Service.getBalance();
      setBalance(balanceData.formatted);
    } catch (error) {
      toast.error(`Failed to fetch balance: ${error.message}`);
    }
  };

  const sendTransaction = async () => {
    if (!recipientAddress || !sendAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!Web3Service.isValidAddress(recipientAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (parseFloat(sendAmount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setSending(true);
      
      const result = await Web3Service.sendTransaction(recipientAddress, sendAmount);
      
      // Add transaction to local history
      const newTransaction = {
        hash: result.transactionHash,
        from: result.from,
        to: result.to,
        amount: result.amount,
        timestamp: new Date().toLocaleString(),
        type: 'sent'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Clear form
      setRecipientAddress('');
      setSendAmount('');
      
      // Refresh balance
      await refreshBalance();
      
      toast.success(`Transaction sent! Hash: ${result.transactionHash.substring(0, 10)}...`);
    } catch (error) {
      toast.error(`Transaction failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const addTestnetETH = () => {
    toast.info('Visit https://sepoliafaucet.com/ to get free test ETH');
    window.open('https://sepoliafaucet.com/', '_blank');
  };

  if (!Web3Service.isMetaMaskInstalled()) {
    return (
      <div className="wallet-container">
        <div className="wallet-header">
          <h1 className="wallet-title">Web3 Wallet</h1>
          <div className="connection-status disconnected">
            MetaMask Not Detected
          </div>
        </div>
        <div className="metamask-install">
          <p>Please install MetaMask to use this wallet interface.</p>
          <button 
            className="wallet-button"
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
          >
            Install MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1 className="wallet-title">Web3 Wallet Interface</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Not Connected'}
          {loading && <div className="loading-spinner"></div>}
        </div>
      </div>

      {!isConnected ? (
        <div className="connect-section">
          <button 
            className="wallet-button" 
            onClick={connectWallet} 
            disabled={loading}
          >
            Connect Wallet {loading && <div className="loading-spinner"></div>}
          </button>
        </div>
      ) : (
        <>
          <div className="wallet-info">
            <div className="info-row">
              <span className="info-label">Account:</span>
              <span 
                className="info-value clickable"
                onClick={() => copyToClipboard(account)}
              >
                {Web3Service.formatAddress(account)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Balance:</span>
              <span className="info-value">{balance} ETH</span>
            </div>
            <div className="info-row">
              <span className="info-label">Network:</span>
              <span className="info-value">{Web3Service.getNetworkName(networkId)}</span>
            </div>
            <div className="wallet-actions">
              <button className="wallet-button secondary" onClick={refreshBalance}>
                Refresh Balance
              </button>
              <button className="wallet-button secondary" onClick={addTestnetETH}>
                Get Test ETH
              </button>
              <button className="wallet-button secondary" onClick={disconnect}>
                Disconnect
              </button>
            </div>
          </div>

          <div className="wallet-section">
            <h3 className="section-title">Send ETH</h3>
            <input
              className="wallet-input"
              type="text"
              placeholder="Recipient address (0x...)"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
            <input
              className="wallet-input"
              type="number"
              placeholder="Amount in ETH"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              step="0.0001"
            />
            <button 
              className="wallet-button" 
              onClick={sendTransaction} 
              disabled={sending}
            >
              Send Transaction {sending && <div className="loading-spinner"></div>}
            </button>
          </div>

          {transactions.length > 0 && (
            <div className="wallet-section">
              <h3 className="section-title">Recent Transactions</h3>
              <div className="transaction-list">
                {transactions.map((tx, index) => (
                  <div key={index} className="transaction-item">
                    <div>Hash: {tx.hash}</div>
                    <div>To: {Web3Service.formatAddress(tx.to)}</div>
                    <div>Amount: {tx.amount} ETH</div>
                    <div>Time: {tx.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
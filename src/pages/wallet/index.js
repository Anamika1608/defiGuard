import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import web3Service from '../../hooks/index';
import "./index.css";

export default function Wallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [networkId, setNetworkId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  
  // Send transaction states
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  
  // Transaction history
  const [transactions, setTransactions] = useState([]);
  
  // Network selection state
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    try {
      if (web3Service.isMetaMaskInstalled()) {
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
    web3Service.onAccountChange((newAccount) => {
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
    web3Service.onNetworkChange((newNetworkId) => {
      setNetworkId(newNetworkId);
      refreshBalance();
      const networkName = web3Service.getNetworkName(newNetworkId);
      const isTestnet = web3Service.isTestnet(newNetworkId);
      toast.info(`Network changed to ${networkName}${isTestnet ? ' (Testnet)' : ''}`);
    });
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      if (!web3Service.isMetaMaskInstalled()) {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      const result = await web3Service.initWeb3();
      
      setIsConnected(true);
      setAccount(result.account);
      setNetworkId(result.networkId);
      
      await refreshBalance();
      
      const networkName = web3Service.getNetworkName(result.networkId);
      toast.success(`Wallet connected successfully! Network: ${networkName}`);
    } catch (error) {
      toast.error(`Failed to connect wallet: ${error.message}`);
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    web3Service.disconnect();
    setIsConnected(false);
    setAccount('');
    setBalance('0');
    setNetworkId(null);
    setTransactions([]);
    setShowNetworkSelector(false);
    toast.info('Wallet disconnected');
  };

  const refreshBalance = async () => {
    try {
      if (!isConnected) return;
      
      const balanceData = await web3Service.getBalance();
      setBalance(balanceData.formatted);
    } catch (error) {
      toast.error(`Failed to fetch balance: ${error.message}`);
    }
  };

  const switchNetwork = async (chainId) => {
    try {
      setSwitchingNetwork(true);
      await web3Service.switchNetwork(chainId);
      setShowNetworkSelector(false);
      // Network change will be handled by the event listener
    } catch (error) {
      toast.error(`Failed to switch network: ${error.message}`);
      console.error('Network switch error:', error);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const sendTransaction = async () => {
    if (!recipientAddress || !sendAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!web3Service.isValidAddress(recipientAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (parseFloat(sendAmount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setSending(true);
      
      const result = await web3Service.sendTransaction(recipientAddress, sendAmount);
      
      // Add transaction to local history
      const newTransaction = {
        hash: result.transactionHash,
        from: result.from,
        to: result.to,
        amount: result.amount,
        timestamp: new Date().toLocaleString(),
        type: 'sent',
        network: web3Service.getNetworkName(networkId)
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

  const openFaucet = () => {
    const faucetUrl = web3Service.getFaucetUrl(networkId);
    if (faucetUrl) {
      window.open(faucetUrl, '_blank');
      toast.info('Opening faucet in new tab');
    } else {
      toast.warn('No faucet available for this network');
    }
  };

  const getCurrentNetwork = () => {
    return web3Service.getCurrentNetwork();
  };

  const getSupportedNetworks = () => {
    return web3Service.getSupportedNetworks();
  };

  if (!web3Service.isMetaMaskInstalled()) {
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
                {web3Service.formatAddress(account)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Balance:</span>
              <span className="info-value">{balance} ETH</span>
            </div>
            <div className="info-row">
              <span className="info-label">Network:</span>
              <span className="info-value">
                {web3Service.getNetworkName(networkId)}
                {web3Service.isTestnet(networkId) && <span className="testnet-badge">Testnet</span>}
              </span>
            </div>
            <div className="wallet-actions">
              <button className="wallet-button secondary" onClick={refreshBalance}>
                Refresh Balance
              </button>
              <button 
                className="wallet-button secondary" 
                onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                disabled={switchingNetwork}
              >
                Switch Network {switchingNetwork && <div className="loading-spinner"></div>}
              </button>
              {web3Service.isTestnet(networkId) && (
                <button className="wallet-button secondary" onClick={openFaucet}>
                  Get Test ETH
                </button>
              )}
              <button className="wallet-button secondary" onClick={disconnect}>
                Disconnect
              </button>
            </div>
          </div>

          {/* Network Selector */}
          {showNetworkSelector && (
            <div className="wallet-section">
              <h3 className="section-title">Select Network</h3>
              <div className="network-grid">
                {getSupportedNetworks().map((network) => {
                  const isCurrentNetwork = network.chainId === `0x${networkId?.toString(16)}`;
                  return (
                    <div 
                      key={network.chainId} 
                      className={`network-card ${isCurrentNetwork ? 'active' : ''}`}
                      onClick={() => !isCurrentNetwork && switchNetwork(network.chainId)}
                    >
                      <div className="network-name">
                        {network.displayName}
                        {network.isTestnet && <span className="testnet-badge">Testnet</span>}
                      </div>
                      <div className="network-currency">
                        {network.nativeCurrency.symbol}
                      </div>
                      {isCurrentNetwork && <div className="current-network">Current</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                    <div>To: {web3Service.formatAddress(tx.to)}</div>
                    <div>Amount: {tx.amount} ETH</div>
                    <div>Network: {tx.network}</div>
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
import React from 'react';
import web3Service from '../../hooks/index';

export default function NetworkInfo({ networkId, onSwitchNetwork }) {
  const getCurrentNetwork = () => {
    return web3Service.getCurrentNetwork();
  };

  const isTestnet = () => {
    return web3Service.isTestnet(networkId);
  };

  const getNetworkStatus = () => {
    const currentNetwork = getCurrentNetwork();
    if (!currentNetwork) {
      return {
        status: 'unknown',
        message: 'Unknown network',
        color: '#ef4444'
      };
    }

    if (currentNetwork.isTestnet) {
      return {
        status: 'testnet',
        message: 'Safe for testing',
        color: '#f59e0b'
      };
    }

    return {
      status: 'mainnet',
      message: 'Real funds at risk',
      color: '#ef4444'
    };
  };

  const networkStatus = getNetworkStatus();
  const currentNetwork = getCurrentNetwork();

  return (
    <div className="network-info">
      <div className="network-header">
        <div className="network-details">
          <span className="network-name">
            {web3Service.getNetworkName(networkId)}
          </span>
          <span 
            className="network-status-badge" 
            style={{ backgroundColor: networkStatus.color }}
          >
            {networkStatus.message}
          </span>
        </div>
        <button 
          className="wallet-button secondary small"
          onClick={onSwitchNetwork}
        >
          Switch
        </button>
      </div>
      
      {currentNetwork && (
        <div className="network-metadata">
          <div className="network-meta-item">
            <span>Chain ID:</span>
            <span>{networkId}</span>
          </div>
          <div className="network-meta-item">
            <span>Currency:</span>
            <span>{currentNetwork.nativeCurrency.symbol}</span>
          </div>
          {currentNetwork.blockExplorerUrls && (
            <div className="network-meta-item">
              <span>Explorer:</span>
              <a 
                href={currentNetwork.blockExplorerUrls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                View on Explorer
              </a>
            </div>
          )}
        </div>
      )}
      
      {isTestnet() && (
        <div className="testnet-warning">
          <span className="warning-icon">⚠️</span>
          <span>This is a test network. Funds have no real value.</span>
        </div>
      )}
    </div>
  );
}
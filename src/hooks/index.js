import { Web3 } from 'web3';

class Web3Service {
  constructor() {
    this.web3 = null;
    this.account = null;
    this.networkId = null;
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // Initialize Web3 connection
  async initWeb3() {
    try {
      if (!this.isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Initialize Web3 with MetaMask provider
      this.web3 = new Web3(window.ethereum);
      
      // Get current account
      const accounts = await this.web3.eth.getAccounts();
      this.account = accounts[0];
      
      // Get network ID
      this.networkId = await this.web3.eth.net.getId();
      
      console.log('Web3 initialized successfully');
      console.log('Connected account:', this.account);
      console.log('Network ID:', this.networkId);
      
      return {
        success: true,
        account: this.account,
        networkId: this.networkId
      };
    } catch (error) {
      console.error('Error initializing Web3:', error);
      throw error;
    }
  }

  // Get current account
  async getCurrentAccount() {
    if (!this.web3) {
      await this.initWeb3();
    }
    
    const accounts = await this.web3.eth.getAccounts();
    this.account = accounts[0];
    return this.account;
  }

  // Get ETH balance
  async getBalance(address = null) {
    try {
      if (!this.web3) {
        await this.initWeb3();
      }
      
      const targetAddress = address || this.account;
      if (!targetAddress) {
        throw new Error('No address provided and no connected account');
      }
      
      // Get balance in Wei
      const balanceWei = await this.web3.eth.getBalance(targetAddress);
      
      // Convert Wei to ETH
      const balanceEth = this.web3.utils.fromWei(balanceWei, 'ether');
      
      return {
        wei: balanceWei.toString(),
        eth: balanceEth,
        formatted: parseFloat(balanceEth).toFixed(6)
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Send ETH transaction
  async sendTransaction(toAddress, amountInEth) {
    try {
      if (!this.web3 || !this.account) {
        await this.initWeb3();
      }

      // Validate inputs
      if (!this.web3.utils.isAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      if (parseFloat(amountInEth) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Convert ETH to Wei
      const amountInWei = this.web3.utils.toWei(amountInEth.toString(), 'ether');

      // Check if sender has sufficient balance
      const balance = await this.getBalance();
      if (parseFloat(balance.eth) < parseFloat(amountInEth)) {
        throw new Error('Insufficient balance');
      }

      // Estimate gas
      const gasEstimate = await this.web3.eth.estimateGas({
        from: this.account,
        to: toAddress,
        value: amountInWei
      });

      // Get current gas price
      const gasPrice = await this.web3.eth.getGasPrice();

      // Send transaction
      const txHash = await this.web3.eth.sendTransaction({
        from: this.account,
        to: toAddress,
        value: amountInWei,
        gas: gasEstimate,
        gasPrice: gasPrice
      });

      console.log('Transaction sent:', txHash);
      return {
        success: true,
        transactionHash: txHash.transactionHash || txHash,
        from: this.account,
        to: toAddress,
        amount: amountInEth,
        gasUsed: gasEstimate.toString()
      };
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash) {
    try {
      if (!this.web3) {
        await this.initWeb3();
      }
      
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      throw error;
    }
  }

  // Get supported networks
  getSupportedNetworks() {
    return [
      {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        displayName: 'Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io/'],
        isTestnet: false
      },
      {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        displayName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io/'],
        isTestnet: true
      },
      {
        chainId: '0x5',
        chainName: 'Goerli Testnet',
        displayName: 'Goerli',
        nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://goerli.infura.io/v3/'],
        blockExplorerUrls: ['https://goerli.etherscan.io/'],
        isTestnet: true
      },
      {
        chainId: '0x13881',
        chainName: 'Polygon Mumbai Testnet',
        displayName: 'Mumbai',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
        isTestnet: true
      }
    ];
  }

  // Get network name
  getNetworkName(networkId) {
    const networks = {
      1: 'Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      11155111: 'Sepolia',
      80001: 'Mumbai',
      1337: 'Local'
    };
    return networks[networkId] || `Unknown (${networkId})`;
  }

  // Get current network details
  getCurrentNetwork() {
    const supportedNetworks = this.getSupportedNetworks();
    const currentChainId = this.networkId ? `0x${this.networkId.toString(16)}` : null;
    return supportedNetworks.find(network => network.chainId === currentChainId) || null;
  }

  // Switch network
  async switchNetwork(chainId) {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      console.log(`Switched to network: ${chainId}`);
      return { success: true };
    } catch (error) {
      // If network doesn't exist in MetaMask, add it
      if (error.code === 4902) {
        return await this.addNetwork(chainId);
      }
      console.error('Error switching network:', error);
      throw error;
    }
  }

  // Add network to MetaMask
  async addNetwork(chainId) {
    try {
      const supportedNetworks = this.getSupportedNetworks();
      const networkToAdd = supportedNetworks.find(network => network.chainId === chainId);
      
      if (!networkToAdd) {
        throw new Error('Unsupported network');
      }

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkToAdd],
      });

      console.log(`Added and switched to network: ${networkToAdd.chainName}`);
      return { success: true };
    } catch (error) {
      console.error('Error adding network:', error);
      throw error;
    }
  }

  // Get network faucet URL
  getFaucetUrl(networkId) {
    const faucets = {
      11155111: 'https://sepoliafaucet.com/', // Sepolia
      5: 'https://goerlifaucet.com/', // Goerli
      80001: 'https://faucet.polygon.technology/' // Mumbai
    };
    return faucets[networkId] || null;
  }

  // Check if network is testnet
  isTestnet(networkId) {
    const testnets = [3, 4, 5, 11155111, 80001, 1337];
    return testnets.includes(Number(networkId));
  }

  // Listen for account changes
  onAccountChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          this.account = accounts[0];
          callback(accounts[0]);
        } else {
          this.account = null;
          callback(null);
        }
      });
    }
  }

  // Listen for network changes
  onNetworkChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        this.networkId = parseInt(chainId, 16);
        callback(this.networkId);
      });
    }
  }

  // Disconnect wallet
  disconnect() {
    this.web3 = null;
    this.account = null;
    this.networkId = null;
  }

  // Utility: Format address for display
  formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Utility: Validate Ethereum address
  isValidAddress(address) {
    return this.web3 ? this.web3.utils.isAddress(address) : false;
  }
}

export default new Web3Service();
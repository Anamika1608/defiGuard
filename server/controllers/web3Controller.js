const { Web3 } = require('web3');


const web3 = new Web3(process.env.ETHEREUM_RPC_URL);

/**
 * @desc Get transaction details
 * @route GET /api/web3/transaction/:hash
 * @access public
 */
module.exports.getTransaction = async (req, res, next) => {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return res.status(400).json({ msg: "Transaction hash is required", status: false });
    }

    // Get transaction details
    const transaction = await web3.eth.getTransaction(hash);
    
    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found", status: false });
    }

    // Get transaction receipt for additional details
    const receipt = await web3.eth.getTransactionReceipt(hash);

    // Format the response
    const formattedTransaction = {
      hash: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      value: web3.utils.fromWei(transaction.value, 'ether'),
      gasPrice: transaction.gasPrice,
      gasLimit: transaction.gas,
      gasUsed: receipt ? receipt.gasUsed : null,
      blockNumber: transaction.blockNumber,
      status: receipt ? (receipt.status ? 'success' : 'failed') : 'pending',
      timestamp: null // Will be filled if block exists
    };

    // Get block timestamp if transaction is mined
    if (transaction.blockNumber) {
      const block = await web3.eth.getBlock(transaction.blockNumber);
      formattedTransaction.timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
    }

    return res.json({ 
      status: true, 
      transaction: formattedTransaction 
    });
  } catch (ex) {
    console.error('Error getting transaction:', ex);
    next(ex);
  }
};

/**
 * @desc Get address balance
 * @route GET /api/web3/balance/:address
 * @access public
 */
module.exports.getBalance = async (req, res, next) => {
  try {
    const { address } = req.params;
    
    if (!address || !web3.utils.isAddress(address)) {
      return res.status(400).json({ msg: "Valid address is required", status: false });
    }

    // Get balance in Wei
    const balanceWei = await web3.eth.getBalance(address);
    
    // Convert to ETH
    const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

    return res.json({
      status: true,
      balance: {
        wei: balanceWei.toString(),
        eth: balanceEth,
        formatted: parseFloat(balanceEth).toFixed(6)
      }
    });
  } catch (ex) {
    console.error('Error getting balance:', ex);
    next(ex);
  }
};

/**
 * @desc Get current gas prices
 * @route GET /api/web3/gas-price
 * @access public
 */
module.exports.getGasPrice = async (req, res, next) => {
  try {
    const gasPrice = await web3.eth.getGasPrice();
    const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');

    return res.json({
      status: true,
      gasPrice: {
        wei: gasPrice.toString(),
        gwei: gasPriceGwei,
        formatted: parseFloat(gasPriceGwei).toFixed(2)
      }
    });
  } catch (ex) {
    console.error('Error getting gas price:', ex);
    next(ex);
  }
};

/**
 * @desc Validate Ethereum address
 * @route POST /api/web3/validate-address
 * @access public
 */
module.exports.validateAddress = async (req, res, next) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ msg: "Address is required", status: false });
    }

    const isValid = web3.utils.isAddress(address);
    
    return res.json({
      status: true,
      isValid,
      address: isValid ? web3.utils.toChecksumAddress(address) : null
    });
  } catch (ex) {
    console.error('Error validating address:', ex);
    next(ex);
  }
};
const { 
  getTransaction, 
  getBalance, 
  getGasPrice, 
  validateAddress 
} = require("../controllers/web3Controller");

const router = require("express").Router();

router.get("/transaction/:hash", getTransaction);
router.get("/balance/:address", getBalance);
router.get("/gas-price", getGasPrice);
router.post("/validate-address", validateAddress);

module.exports = router;
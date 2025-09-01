const express = require('express');
const {
  createLoan,
  getUserLoans,
  getLoansBetweenUsers,
  updateLoan,
  deleteLoan
} = require('../controllers/loanController');

const router = express.Router();

router.post('/', createLoan);
router.get('/:userId', getUserLoans);
router.get('/:userId/:otherUserId', getLoansBetweenUsers);
router.patch('/:loanId', updateLoan);
router.delete('/:loanId', deleteLoan);

module.exports = router;
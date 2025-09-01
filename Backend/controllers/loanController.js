const Loan = require('../models/Loan');
const User = require('../models/user');
const { validateObjectId } = require('../utils/validators');

const createLoan = async (req, res, next) => {
  try {
    const { personToBePaidId, personToPayId, amount, purpose } = req.body;

    // Validate input
    if (!personToBePaidId || !personToPayId || !amount || !purpose) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateObjectId(personToBePaidId) || !validateObjectId(personToPayId)) {
      return res.status(400).json({ error: 'Invalid user IDs' });
    }

    if (personToBePaidId === personToPayId) {
      return res.status(400).json({ error: 'Cannot create loan to yourself' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Check if both users exist
    const [personToBePaid, personToPay] = await Promise.all([
      User.findById(personToBePaidId),
      User.findById(personToPayId)
    ]);

    if (!personToBePaid) {
      return res.status(404).json({ error: 'Person to be paid not found' });
    }

    if (!personToPay) {
      return res.status(404).json({ error: 'Person to pay not found' });
    }

    const loan = new Loan({
      personToBePaid: personToBePaidId,
      personToPay: personToPayId,
      amount,
      purpose: purpose.trim()
    });

    await loan.save();
    await loan.populate(['personToBePaid', 'personToPay']);

    res.status(201).json(loan);
  } catch (error) {
    next(error);
  }
};

const getUserLoans = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!validateObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [loansToReceive, loansToPay] = await Promise.all([
      Loan.find({ personToBePaid: userId }).populate(['personToBePaid', 'personToPay']),
      Loan.find({ personToPay: userId }).populate(['personToBePaid', 'personToPay'])
    ]);

    res.json({
      loansToReceive,
      loansToPay
    });
  } catch (error) {
    next(error);
  }
};

const getLoansBetweenUsers = async (req, res, next) => {
  try {
    const { userId, otherUserId } = req.params;

    if (!validateObjectId(userId) || !validateObjectId(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user IDs' });
    }

    // Check if both users exist
    const [user, otherUser] = await Promise.all([
      User.findById(userId),
      User.findById(otherUserId)
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!otherUser) {
      return res.status(404).json({ error: 'Other user not found' });
    }

    const loans = await Loan.find({
      $or: [
        { personToBePaid: userId, personToPay: otherUserId },
        { personToBePaid: otherUserId, personToPay: userId }
      ]
    }).populate(['personToBePaid', 'personToPay']);

    res.json(loans);
  } catch (error) {
    next(error);
  }
};

const updateLoan = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { action, amount } = req.body;

    if (!validateObjectId(loanId)) {
      return res.status(400).json({ error: 'Invalid loan ID' });
    }

    if (!action || !amount) {
      return res.status(400).json({ error: 'Action and amount are required' });
    }

    if (!['add', 'paid'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "add" or "paid"' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    let newAmount;
    if (action === 'add') {
      newAmount = loan.amount + amount;
    } else { // action === 'paid'
      newAmount = loan.amount - amount;
    }

    // If loan is fully paid or overpaid, delete it
    if (newAmount <= 0) {
      await Loan.findByIdAndDelete(loanId);
      return res.json({ message: 'Loan fully paid and removed' });
    }

    // Update the loan
    loan.amount = newAmount;
    loan.lastUpdated = new Date();
    await loan.save();
    await loan.populate(['personToBePaid', 'personToPay']);

    res.json(loan);
  } catch (error) {
    next(error);
  }
};

const deleteLoan = async (req, res, next) => {
  try {
    const { loanId } = req.params;

    if (!validateObjectId(loanId)) {
      return res.status(400).json({ error: 'Invalid loan ID' });
    }

    const loan = await Loan.findByIdAndDelete(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json({ message: 'Loan deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLoan,
  getUserLoans,
  getLoansBetweenUsers,
  updateLoan,
  deleteLoan
};
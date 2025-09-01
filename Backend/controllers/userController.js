const User = require('../models/user');
const Loan = require('../models/Loan');
const { validateObjectId } = require('../utils/validators');

const login = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if user exists
    let user = await User.findOne({ username: username.trim() });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({ username: username.trim() });
      await user.save();
    }

    res.json({
      id: user._id,
      username: user.username
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all loans involving this user
    await Loan.deleteMany({
      $or: [
        { personToBePaid: id },
        { personToPay: id }
      ]
    });

    // Delete the user
    await User.findByIdAndDelete(id);

    res.json({ message: 'User logged out and loans deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout
};

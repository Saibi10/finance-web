const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  personToBePaid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Person to be paid is required']
  },
  personToPay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Person to pay is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [200, 'Purpose cannot exceed 200 characters']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated on save
loanSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
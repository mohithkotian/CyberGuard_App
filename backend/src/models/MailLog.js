const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: [true, 'Recipient email is required'],
  },
  recipientPhone: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
  },
  body: {
    type: String,
    required: [true, 'Email body is required'],
  },
  textMessage: {
    type: String,
    default: '',
  },
  complaintId: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    default: 'delivered',
  },
  provider: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  smsStatus: {
    type: String,
    default: '',
  },
  smsSid: {
    type: String,
    default: '',
  },
  smsError: {
    type: String,
    default: '',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MailLog', mailLogSchema);

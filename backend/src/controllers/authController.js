const { User } = require('../models');
const { ActivityLog } = require('../models');
const { USER_ROLES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../services/mailer');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, ward, role = USER_ROLES.CITIZEN, department } = req.body;

  // Admin-only for non-citizen roles
  if (role !== USER_ROLES.CITIZEN) {
    const requestingUser = req.user;
    if (!requestingUser || !['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create official/admin accounts'
      });
    }
  }

  const emailExists = await User.findOne({ where: { email } });
  if (emailExists) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    name, email, password, phone, ward, role, department,
    ...(role === USER_ROLES.CITIZEN ? { isActive: true } : {})
  });

  const token = user.generateAuthToken();

  // Send a welcome email (fire-and-forget; never blocks registration)
  sendEmail({
    to: user.email,
    subject: 'Welcome to CivicSense AI',
    text: `Hi ${user.name},\n\nYour CivicSense AI account has been created.\nUsername (email): ${user.email}\nRole: ${user.role}\n\nYou can now log in and report civic issues — our AI will route them to the right department.\n\n— CivicSense AI`
  });

  res.status(201).json({
    success: true,
    token,
    user: user.toJSON()
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  // Include password for comparison
  const user = await User.findOne({ where: { email }, attributes: { include: ['password'] } });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account deactivated' });
  }

  user.lastLogin = new Date();
  await user.save({ fields: ['lastLogin'] });

  await ActivityLog.create({
    userId: user.id,
    action: 'user_login',
    details: JSON.stringify({ email: user.email })
  });

  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    token,
    user: user.toJSON()
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, ward, avatar } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (ward) updates.ward = ward;
  if (avatar) updates.avatar = avatar;

  await req.user.update(updates);
  const user = req.user.toJSON();

  res.status(200).json({ success: true, user });
});

module.exports = { register, login, getMe, updateProfile };
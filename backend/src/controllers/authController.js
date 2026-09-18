import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';

const normalizePhone = (phone = '') => phone.replace(/^\+91/, '').trim();

const isAdminCredentials = (phone, password) => {
  const adminPhone = config.adminPhone;
  const adminPassword = config.adminPassword;
  if (!adminPhone || !adminPassword) return false;
  return normalizePhone(phone) === adminPhone && password === adminPassword;
};

const generateToken = (userId, isAdmin = false) =>
  jwt.sign({ userId, isAdmin }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, phone, and password are required',
        requestId: req.requestId,
      });
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      return res.status(422).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number',
        requestId: req.requestId,
      });
    }
    if (password.length < 6) {
      return res.status(422).json({
        success: false,
        message: 'Password must be at least 6 characters',
        requestId: req.requestId,
      });
    }

    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered',
        requestId: req.requestId,
      });
    }

    const user = await User.create({ name: name.trim(), phone: phone.trim(), password });
    const token = generateToken(user._id, false);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      requestId: req.requestId,
      data: { token, user: { id: user._id, name: user.name, phone: user.phone, isAdmin: false } },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(422).json({
        success: false,
        message: Object.values(err.errors).map((e) => e.message).join(', '),
        requestId: req.requestId,
      });
    }
    console.error('[Auth] Signup error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'phone and password are required',
        requestId: req.requestId,
      });
    }

    const normalizedInputPhone = normalizePhone(phone);

    let user = await User.findOne({
      phone: { $in: [phone.trim(), normalizedInputPhone, `+91${normalizedInputPhone}`] },
    }).select('+password');

    const adminLogin = isAdminCredentials(phone, password);

    if (adminLogin && !user) {
      user = await User.create({
        name: 'Admin',
        phone: normalizePhone(phone),
        password,
      });
      user = await User.findById(user._id).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
        requestId: req.requestId,
      });
    }

    if (!adminLogin && !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
        requestId: req.requestId,
      });
    }

    const token = generateToken(user._id, adminLogin);
    return res.json({
      success: true,
      message: 'Login successful',
      requestId: req.requestId,
      data: { token, user: { id: user._id, name: user.name, phone: user.phone, isAdmin: adminLogin } },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};

// GET /api/auth/me (protected)
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', requestId: req.requestId });
    }
    return res.json({
      success: true,
      requestId: req.requestId,
      data: { user: { id: user._id, name: user.name, phone: user.phone, isAdmin: Boolean(req.user?.isAdmin) } },
    });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};

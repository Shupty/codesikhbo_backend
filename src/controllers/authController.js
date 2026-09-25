const { credentials, registration } = require("../validators/auth");
const authService = require("../services/authService");

async function register(req, res) {
  const input = registration.parse(req.body);
  res.status(201).json(await authService.register(input));
}

async function login(req, res) {
  const input = credentials.parse(req.body);
  res.json(await authService.login(input));
}

async function me(req, res) {
  res.json({ user: await authService.currentUser(req.auth.userId) });
}

module.exports = { register, login, me };

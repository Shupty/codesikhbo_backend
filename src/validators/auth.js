const { z } = require("zod");

const credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128)
});

const registration = credentials.extend({
  name: z.string().trim().min(2).max(120)
});

module.exports = { credentials, registration };

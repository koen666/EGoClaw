import crypto from "node:crypto";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export class AuthService {
  constructor({ pool }) {
    this.pool = pool;
  }

  async register({ username, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername || !normalizedEmail || !password) {
      throw new Error("请完整填写用户名、邮箱和密码");
    }
    if (password.length < 6) {
      throw new Error("密码至少需要 6 位");
    }

    const passwordHash = hashPassword(password);
    let result;
    try {
      [result] = await this.pool.query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [normalizedUsername, normalizedEmail, passwordHash]
      );
    } catch (error) {
      if (error?.code === "ER_DUP_ENTRY") {
        if (String(error.message).includes("uq_users_email")) {
          throw new Error("这个邮箱已经注册过了");
        }
        if (String(error.message).includes("uq_users_username")) {
          throw new Error("这个用户名已经被占用");
        }
        throw new Error("账号信息重复，请更换后再试");
      }
      throw error;
    }

    const [rows] = await this.pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }

  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      throw new Error("请输入邮箱和密码");
    }
    const [rows] = await this.pool.query(
      "SELECT id, username, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );
    const user = rows[0];
    if (!user) {
      throw new Error("账号不存在");
    }
    if (!verifyPassword(password, user.password_hash)) {
      throw new Error("密码错误");
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    };
  }

  async loadUserState(userId) {
    const [rows] = await this.pool.query(
      "SELECT state_json FROM user_states WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!rows[0]?.state_json) return null;
    return JSON.parse(rows[0].state_json);
  }

  async saveUserState(userId, state) {
    await this.pool.query(
      `
        INSERT INTO user_states (user_id, state_json)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)
      `,
      [userId, JSON.stringify(state)]
    );
  }
}

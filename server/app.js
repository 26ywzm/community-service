const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const jwtSecret = 'your_jwt_secret';

// 模拟数据库
const users = {};

// 用户注册
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (users[username]) {
    return res.status(400).send({ message: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);
  users[username] = { username, password: hashedPassword };

  res.send({ message: '用户注册成功' });
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = users[username];
  if (!user) {
    return res.status(404).send({ message: '用户不存在' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).send({ message: '密码错误' });
  }

  const token = jwt.sign({ username: user.username }, jwtSecret, { expiresIn: '1h' });
  res.send({ message: '登录成功', token });
});

// 启动服务器
app.listen(3000, () => {
  console.log('http://localhost:3000');
});

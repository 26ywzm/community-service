 # 社区服务网站（毕业设计）

## community-service 前端（vue3）

#### Vue CLI初始化项目
> vue create community-service

#### 安装依赖

> npm install axios vue-router

#### 前端启动
> npm run serve

## server 后端(node.js + Express)

#### 安装依赖

> npm install express mysql2 cors body-parser

#### 后端启动

> node app.js

#### API设计
用户注册 API：GST http://localhost:3000/api/auth/register

用户登录 API：GST http://localhost:3000/api/auth/login

获取用户 API: GST HTTP://localhost:3000/api/auth//profile

获取用户列表 API: GST HTTP://localhost:3000/api/auth/users

获取管理员列表 API: GST HTTP://localhost:3000/api/auth/admins

升为管理员 API: GET HTTP://localhost:3000/api/auth/promote/:id 

降为用户 API: GET HTTP://localhost:3000/api/auth//demote/:id

获取新闻详细 API: GET HTTP://localhost:3000/api/auth/news/:id

发布新闻 API: GET HTTP://localhost:3000/api/auth/articles

获取文章详细 API: GET HTTP://localhost:3000/api/auth//articles/:id

获取菜单 API GET HTTP://localhost:3000/api/auth/canteen/menu

处理订单 API GET HTTP://localhost:3000/api/auth/canteen/order

轮播图 API: GET http://localhost:3000/api/carousel-images

热门新闻 API: GET http://localhost:3000/api/hot-news

新闻列表 API: GET http://localhost:3000/api/news-list

## Mysql 连接
### 用户表
> CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,                       -- 用户 ID，自动递增
  username VARCHAR(255) NOT NULL,                          -- 用户名，非空
  password VARCHAR(255) NOT NULL,                          -- 密码，非空
  email VARCHAR(255) NOT NULL,                             -- 邮箱，非空
  role ENUM('user', 'admin', 'super_admin') DEFAULT 'user' NOT NULL, -- 角色，默认 'user'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- 记录创建时间
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 记录更新时间
);


### 文章数据表
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,       -- 唯一标识符，自动递增
    title VARCHAR(255) NOT NULL,             -- 文章标题
    content TEXT,                            -- 文章内容
    image_url VARCHAR(255),                  -- 新闻相关图片链接
    category ENUM('carousel', 'hotNews', 'newsList') NOT NULL,  -- 文章类型
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
);







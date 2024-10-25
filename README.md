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
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    email VARCHAR(255)
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

### 菜单项表（menu_items）
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- 菜品ID，自动递增
    name VARCHAR(255) NOT NULL,                  -- 菜品名称
    description TEXT,                            -- 菜品描述
    price DECIMAL(10, 2) NOT NULL,               -- 菜品价格
    image_url VARCHAR(255),                      -- 菜品图片的链接
    available BOOLEAN DEFAULT TRUE,              -- 菜品是否在售
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 菜品创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- 菜品更新时间
);

### 订单表（orders）
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- 关联用户
    menu_item_id INT NOT NULL, -- 关联菜单项
    quantity INT NOT NULL, -- 订购数量
    total_price DECIMAL(10, 2) NOT NULL, -- 总价格
    status ENUM('pending', 'confirmed', 'completed') DEFAULT 'pending', -- 订单状态
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);
### 订单状态表（可选，order_status）
CREATE TABLE order_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL             -- 例如 'pending', 'completed', 'cancelled'
);

### 插入测试数据
INSERT INTO menu_items (name, description, price, image_url, available) 
VALUES 
('宫保鸡丁', '经典中式菜肴，辣味十足', 28.00, 'http://example.com/gongbao.jpg', TRUE),
('红烧肉', '肥而不腻的红烧肉', 35.00, 'http://example.com/hongshao.jpg', TRUE),
('清炒西兰花', '清新爽口的西兰花', 18.00, 'http://example.com/xilanhua.jpg', TRUE);

### 轮播图新闻表 (carousel_images)
CREATE TABLE carousel_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL, -- 轮播图的图片链接
    alt_text VARCHAR(100), -- 图片的替代文本（用于SEO）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
);

> id: 唯一标识符，自动递增。
image_url: 存储轮播图的图片地址。
alt_text: 用于描述图片的替代文本，增强无障碍性和SEO。
created_at 和 updated_at: 记录数据的创建和更新时间。

### 热门新闻表 (hot_news)
CREATE TABLE hot_news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL, -- 新闻标题
    image_url VARCHAR(255), -- 新闻相关图片链接
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
);
> id: 唯一标识符，自动递增。
title: 热门新闻的标题。
image_url: 存储与热门新闻相关的图片链接。
created_at 和 updated_at: 记录数据的创建和更新时间。

### 新闻列表表 (news_list)
CREATE TABLE news_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL, -- 新闻标题
    content TEXT, -- 新闻内容
    image_url VARCHAR(255), -- 新闻相关图片链接
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
);
> id: 唯一标识符，自动递增。
title: 新闻的标题。
content: 新闻的详细内容。
image_url: 存储与新闻相关的图片链接。
created_at 和 updated_at: 记录数据的创建和更新时间。

## 插入示例数据
-- 插入轮播图新闻
INSERT INTO carousel_images (image_url, alt_text) VALUES 
('http://example.com/carousel1.jpg', '轮播图1'),
('http://example.com/carousel2.jpg', '轮播图2'),
('http://example.com/carousel3.jpg', '轮播图3');

-- 插入热门新闻
INSERT INTO hot_news (title, image_url) VALUES 
('社区活动一', 'http://example.com/hot1.jpg'),
('社区活动二', 'http://example.com/hot2.jpg'),
('社区活动三', 'http://example.com/hot3.jpg');

-- 插入新闻列表
INSERT INTO news_list (title, content, image_url) VALUES 
('新闻条目1', '这是新闻条目1的详细内容。', 'http://example.com/news1.jpg'),
('新闻条目2', '这是新闻条目2的详细内容。', 'http://example.com/news2.jpg'),
('新闻条目3', '这是新闻条目3的详细内容。', 'http://example.com/news3.jpg');





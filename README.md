 # 社区服务网站（毕业设计）

## community-service
前端启动：npm run serve

## server
npm install express mysql2 cors body-parser
后端启动：node app.js

轮播图 API: GET http://localhost:3000/api/carousel-images

热门新闻 API: GET http://localhost:3000/api/hot-news

新闻列表 API: GET http://localhost:3000/api/news-list
## Mysql 连接
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



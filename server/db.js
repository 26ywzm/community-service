const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功！');
        connection.release();
    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
}

// 初始化数据库表
async function initDatabase() {
    try {
        const connection = await pool.getConnection();

        // 创建用户表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin', 'super_admin') DEFAULT 'user' NOT NULL
            )
        `);

        // 创建文章表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                image_url VARCHAR(255),
                category ENUM('carousel', 'hotNews', 'newsList') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 创建菜品表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image_url VARCHAR(255),
                available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 创建订单表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                status TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 创建订单详情表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                menu_item_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
            )
        `);

        //创建留言或建议表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                message TEXT,
                admin_reply TEXT,
                status ENUM('pending', 'processed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        // 创建投票表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS votes (
            id INT AUTO_INCREMENT PRIMARY KEY,       -- 投票 ID
            title VARCHAR(255) NOT NULL,             -- 投票标题
            description TEXT,                        -- 投票描述
            options TEXT NOT NULL,                   -- 投票选项，JSON格式存储
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
          )
        `);

        // 创建投票结果表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS vote_results (
            id INT AUTO_INCREMENT PRIMARY KEY,       -- 记录 ID
            user_id INT NOT NULL,                     -- 关联用户
            vote_id INT NOT NULL,                     -- 关联投票
            vote_option VARCHAR(255),                 -- 用户选择的选项
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 投票时间
            FOREIGN KEY (user_id) REFERENCES users(id), -- 外键关联用户表
            FOREIGN KEY (vote_id) REFERENCES votes(id)  -- 外键关联投票表
          )
        `);
        console.log('数据库表初始化成功！');
        connection.release();
    } catch (error) {
        console.error('数据库表初始化失败:', error);
        process.exit(1);
    }
}

// 导出连接池和初始化函数
module.exports = {
    pool,
    testConnection,
    initDatabase
};

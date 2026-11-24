import { DataSource } from "typeorm";

export async function initAppSchema(dataSource: DataSource): Promise<void> {
  try {
    await dataSource.query(`CREATE TABLE IF NOT EXISTS homepage_sections (
      section_key VARCHAR(80) PRIMARY KEY,
      draft_content JSON NULL,
      published_content JSON NULL,
      published_visible TINYINT NOT NULL DEFAULT 1,
      draft_visible TINYINT NOT NULL DEFAULT 1,
      display_order INT NOT NULL DEFAULT 0,
      draft_display_order INT NOT NULL DEFAULT 0,
      updated_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_homepage_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await dataSource.query(`CREATE TABLE IF NOT EXISTS content_revisions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      record_type VARCHAR(60) NOT NULL,
      record_key VARCHAR(120) NOT NULL,
      action VARCHAR(30) NOT NULL,
      previous_content JSON NULL,
      new_content JSON NULL,
      admin_user_id INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_content_revision_record (record_type, record_key, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await dataSource.query(`CREATE TABLE IF NOT EXISTS website_pages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(160) NOT NULL UNIQUE,
      draft_slug VARCHAR(160) NULL,
      draft_content JSON NULL,
      published_content JSON NULL,
      old_slugs JSON NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      navigation_visible TINYINT NOT NULL DEFAULT 0,
      display_order INT NOT NULL DEFAULT 0,
      created_by INT NULL,
      updated_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_website_page_status_order (status, display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await dataSource.query(`CREATE TABLE IF NOT EXISTS website_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`group\` VARCHAR(20) NOT NULL,
      slug VARCHAR(160) NOT NULL,
      parent_id INT NULL,
      draft_content JSON NULL,
      published_content JSON NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      display_order INT NOT NULL DEFAULT 0,
      created_by INT NULL,
      updated_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_website_category_group (\`group\`, status, display_order),
      INDEX idx_website_category_parent (parent_id),
      UNIQUE KEY uq_website_category_group_slug (\`group\`, slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    const checkAndAddColumn = async (table: string, column: string, def: string) => {
      try {
        const cols: any[] = await dataSource.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`);
        if (!cols || cols.length === 0) {
          await dataSource.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${def}`);
        }
      } catch (err) {
        console.warn(`Could not add column ${column} to ${table}:`, (err as any)?.message || err);
      }
    };
    await checkAndAddColumn("homepage_sections", "draft_visible", "TINYINT NOT NULL DEFAULT 1");
    await checkAndAddColumn("homepage_sections", "draft_display_order", "INT NOT NULL DEFAULT 0");

    // 1. Upgrade reviews table
    await checkAndAddColumn("reviews", "order_id", "VARCHAR(100) NULL");
    await checkAndAddColumn("reviews", "order_item_id", "VARCHAR(100) NULL");
    await checkAndAddColumn("reviews", "verified_purchase", "TINYINT DEFAULT 1");
    await checkAndAddColumn("reviews", "images_json", "TEXT NULL");
    await checkAndAddColumn("reviews", "status", "VARCHAR(50) DEFAULT 'approved'");
    await checkAndAddColumn("reviews", "helpful_count", "INT DEFAULT 0");
    await checkAndAddColumn("reviews", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    // 2. Ensure review_helpful_votes table exists
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS review_helpful_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        review_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_review_user (review_id, user_id),
        INDEX idx_review_id (review_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Upgrade coupons table
    await checkAndAddColumn("coupons", "max_discount", "DOUBLE NULL");
    await checkAndAddColumn("coupons", "per_customer_limit", "INT DEFAULT 1");
    await checkAndAddColumn("coupons", "first_order_only", "INT DEFAULT 0");
    await checkAndAddColumn("coupons", "start_date", "VARCHAR(50) NULL");

    // 4. Ensure coupon_redemptions table exists
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS coupon_redemptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_code VARCHAR(50) NOT NULL,
        user_id INT NOT NULL,
        order_id VARCHAR(100) NOT NULL,
        discount_amount DOUBLE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_coupon_user (coupon_code, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Upgrade vendors table for branding & contact
    await checkAndAddColumn("vendors", "store_logo", "VARCHAR(500) NULL");
    await checkAndAddColumn("vendors", "store_banner", "VARCHAR(500) NULL");
    await checkAndAddColumn("vendors", "store_email", "VARCHAR(255) NULL");
    await checkAndAddColumn("vendors", "store_phone", "VARCHAR(50) NULL");
    await checkAndAddColumn("vendors", "store_hours", "VARCHAR(255) NULL");
    await checkAndAddColumn("vendors", "store_socials", "TEXT NULL");

    // 6. Ensure users.photo and vendors columns allow NULL / empty strings
    try {
      await dataSource.query("ALTER TABLE `users` MODIFY COLUMN `photo` VARCHAR(500) NULL DEFAULT ''");
    } catch (_) {}
    try {
      await dataSource.query("ALTER TABLE `vendors` MODIFY COLUMN `photo` VARCHAR(500) NULL DEFAULT ''");
    } catch (_) {}
    try {
      await dataSource.query("ALTER TABLE `vendors` MODIFY COLUMN `store_logo` VARCHAR(500) NULL");
    } catch (_) {}
    try {
      await dataSource.query("ALTER TABLE `vendors` MODIFY COLUMN `store_banner` VARCHAR(500) NULL");
    } catch (_) {}

    // 7. Upgrade products table for category-aware selling units, variants & multi-image gallery
    await checkAndAddColumn("products", "selling_unit", "VARCHAR(50) DEFAULT 'piece'");
    await checkAndAddColumn("products", "allow_decimals", "TINYINT DEFAULT 0");
    await checkAndAddColumn("products", "variants_json", "TEXT NULL");
    await checkAndAddColumn("products", "gallery_json", "TEXT NULL");

    // 8. Intelligent backfill for existing products without breaking existing records
    try {
      // Groceries / Produce: kg, litre, dozen, bunch
      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'kg', \`allow_decimals\` = 1
        WHERE (\`selling_unit\` IS NULL OR \`selling_unit\` = 'piece' OR \`selling_unit\` = '')
          AND LOWER(\`category\`) IN ('fruits', 'vegetables', 'grains', 'spices', 'organic fruits', 'fresh vegetables', 'local grains & rice', 'traditional spices & herbs')
          AND LOWER(\`name\`) NOT LIKE '%egg%' AND LOWER(\`name\`) NOT LIKE '%spinach%';
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'dozen', \`allow_decimals\` = 0
        WHERE LOWER(\`name\`) LIKE '%egg%' OR LOWER(\`category\`) LIKE '%egg%';
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'bunch', \`allow_decimals\` = 0
        WHERE LOWER(\`name\`) LIKE '%spinach%' OR LOWER(\`weight\`) LIKE '%bunch%';
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'litre', \`allow_decimals\` = 1
        WHERE (LOWER(\`name\`) LIKE '%milk%' OR LOWER(\`weight\`) LIKE '%litre%' OR LOWER(\`weight\`) LIKE '%1 l%')
          AND LOWER(\`category\`) NOT LIKE '%furniture%';
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'jar', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) IN ('honey', 'honey & preserves') OR LOWER(\`name\`) LIKE '%honey%';
      `);

      // Lifestyle: Furniture -> piece (or set for dining sets / tables)
      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'set', \`allow_decimals\` = 0
        WHERE (LOWER(\`category\`) LIKE '%furniture%' OR LOWER(\`name\`) LIKE '%table%' OR LOWER(\`name\`) LIKE '%chair%')
          AND (LOWER(\`name\`) LIKE '%set%' OR LOWER(\`name\`) LIKE '%dining%');
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'piece', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%furniture%'
          AND \`selling_unit\` NOT IN ('set', 'pair');
      `);

      // Lifestyle: Home & Living -> piece, set (bedsheets), pair (curtains)
      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'set', \`allow_decimals\` = 0
        WHERE (LOWER(\`category\`) LIKE '%home%' OR LOWER(\`name\`) LIKE '%bedsheet%')
          AND (LOWER(\`name\`) LIKE '%set%' OR LOWER(\`name\`) LIKE '%bedsheet%');
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'pair', \`allow_decimals\` = 0
        WHERE (LOWER(\`category\`) LIKE '%home%' OR LOWER(\`name\`) LIKE '%curtain%')
          AND LOWER(\`name\`) LIKE '%curtain%';
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'piece', \`allow_decimals\` = 0
        WHERE (LOWER(\`category\`) LIKE '%home%' OR LOWER(\`category\`) LIKE '%living%')
          AND \`selling_unit\` NOT IN ('set', 'pair', 'pack', 'roll');
      `);

      // Kitchen & Dining -> set (dinner set, glass set), piece (bowl, mortar)
      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'set', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%kitchen%'
          AND (LOWER(\`name\`) LIKE '%set%' OR LOWER(\`name\`) LIKE '%dinner%');
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'piece', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%kitchen%'
          AND \`selling_unit\` NOT IN ('set', 'pair', 'pack');
      `);

      // Fashion & Accessories -> piece (shawl, t-shirt, scarf, bag), pair (shoes, sandals)
      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'pair', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%fashion%'
          AND (LOWER(\`name\`) LIKE '%shoe%' OR LOWER(\`name\`) LIKE '%sandal%' OR LOWER(\`name\`) LIKE '%boot%');
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'piece', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%fashion%'
          AND \`selling_unit\` NOT IN ('pair', 'set', 'pack');
      `);

      // Garden & Outdoor -> set (pots set of 3), piece (tulsi, hoe)
      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'set', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%garden%' AND LOWER(\`name\`) LIKE '%set%';
      `);

      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'piece', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%garden%' AND \`selling_unit\` != 'set';
      `);

      // Beauty & Personal Care -> piece (soap, ubtan, oil)
      await dataSource.query(`
        UPDATE \`products\`
        SET \`selling_unit\` = 'piece', \`allow_decimals\` = 0
        WHERE LOWER(\`category\`) LIKE '%beauty%';
      `);
    } catch (backfillErr) {
      console.warn("Backfill warning:", (backfillErr as any)?.message || backfillErr);
    }

    console.log("Schema verified and initialized successfully.");
  } catch (error) {
    console.error("Schema initialization warning:", error);
  }
}

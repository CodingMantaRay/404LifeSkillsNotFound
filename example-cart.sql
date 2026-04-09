INSERT INTO products VALUES ("prod1", "Product 1", "Wellness at Home", "Bundle", 43.23, "light", "blue", "notes 1");
INSERT INTO products VALUES ("prod2", "Product 2", "Printable Planners", "Pack", 7.99, "medium", "NULL", "notes 2");
INSERT INTO products VALUES ("prod3", "Product 3", "Cleaning Guides", "Download", 20, "heavy", "NULL", "notes 3");

INSERT INTO carts VALUES ("1", "ses1");
INSERT INTO carts VALUES ("2", "ses2");
INSERT INTO carts VALUES ("3", "ses3");
INSERT INTO carts VALUES ("4", "ses4");

INSERT INTO cartItems VALUES ("1", "prod1", 2);
INSERT INTO cartItems VALUES ("1", "prod3", 4);
INSERT INTO cartItems VALUES ("2", "prod2", 1);
INSERT INTO cartItems VALUES ("3", "prod1", 1);
INSERT INTO cartItems VALUES ("3", "prod2", 3);
-- Cart 4 is empty

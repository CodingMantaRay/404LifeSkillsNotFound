create database 404LifeSkills;
use 404LifeSkills;

CREATE TABLE subscribers (
  id INTEGER AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(10),
  age INTEGER,
  address VARCHAR(300),
  PRIMARY KEY (id)
);

CREATE TABLE submissions ( 
  id VARCHAR(30), 
  title VARCHAR(100),
  author VARCHAR(100),
  category VARCHAR(100),
  contentSnippet VARCHAR(1000),
  webFeaturePreferred BOOL,
  emailNewsletterPreferred BOOL,
  subPortalPreferred BOOL,
  blogFeaturePreferred BOOL,
  notes VARCHAR(1000),
  status VARCHAR(50),
  PRIMARY KEY (id)
);

CREATE TABLE articles (
  id VARCHAR(30) PRIMARY KEY,
  title VARCHAR(100),
  category VARCHAR(30),
  format VARCHAR(30),
  value VARCHAR(30),
  notes VARCHAR(300)
);

CREATE TABLE products (
  id VARCHAR(30) PRIMARY KEY, 
  description VARCHAR(300),
  category VARCHAR(30),
  unit VARCHAR(100),
  price FLOAT,
  weight VARCHAR(100),
  color VARCHAR(100),
  details VARCHAR(1000)
);

/*
carts -> cartItems
One to many

cartItems -> products
One to one
*/

CREATE TABLE carts (
  cartId VARCHAR(50) PRIMARY KEY, -- Ties customer to their cart items
  sessionId VARCHAR(50) -- Represents customer (or their browser)
);

CREATE TABLE cartItems (
  cartId VARCHAR(50), 
  productId VARCHAR(30),
  quantity INTEGER,
  PRIMARY KEY (cartId, productId),
  FOREIGN KEY (cartId) REFERENCES carts(cartId) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
);
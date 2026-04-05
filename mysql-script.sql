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
  preferredDistChannel VARCHAR(50),
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

CREATE TABLE publicationOptions ( 
  id VARCHAR(30) PRIMARY KEY, 
  title VARCHAR(100),
  pubDate DATE,
  webFeaturePreferred BOOL,
  emailNewsletterPreferred BOOL,
  subPortalPreferred BOOL,
  blogFeaturePreferred BOOL,
  reviewStatus VARCHAR(20),
  author VARCHAR(100),
  featured VARCHAR(5),
  access VARCHAR(10),
  editNotes VARCHAR(1000)
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

/*
purchases -> purchaseItems
One to many
*/

CREATE TABLE purchases (
  purchaseId VARCHAR(50) PRIMARY KEY, -- Ties customer to their purchased items
  sessionId VARCHAR(30) -- Represents customer (or their browser)
);

CREATE TABLE purchasedItems (
  purchaseId VARCHAR(50), 
  productId VARCHAR(30),
  quantity INTEGER,
  description VARCHAR(300),
  category VARCHAR(30),
  unit VARCHAR(100),
  price FLOAT,
  weight VARCHAR(100),
  color VARCHAR(100),
  details VARCHAR(1000),
  PRIMARY KEY (purchaseId, productId),
  FOREIGN KEY (purchaseId) REFERENCES purchases(purchaseId)
  -- productId is NOT a foreign key since the productId could change after purchase
);

CREATE TABLE billingInfo (
  billingId VARCHAR(50),
  purchaseId VARCHAR(50),
  name VARCHAR(50),
  address VARCHAR(100),
  city VARCHAR(50),
  state VARCHAR(20),
  zipCode VARCHAR(10),
  creditCardNum VARCHAR(16),
  expirationDate VARCHAR(5),
  securityCode VARCHAR(3),
  shippingDetails VARCHAR(30),
  PRIMARY KEY (billingId),
  FOREIGN KEY (purchaseId) REFERENCES purchases(purchaseId)
);

CREATE TABLE returnRequests (
  id VARCHAR(30) PRIMARY KEY,
  sessionId VARCHAR(30),
  productDesc VARCHAR(300),
  price FLOAT,
  reason VARCHAR(50), 
  itemCondition VARCHAR(50),
  notes VARCHAR(300),
  status VARCHAR(20)
);
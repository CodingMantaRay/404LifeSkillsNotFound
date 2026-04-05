/*create database 404LifeSkills;
use 404LifeSkills;
*/
-- Subscribers table
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  age INTEGER,
  address TEXT
);

-- Submissions table
CREATE TABLE submissions ( 
  id TEXT PRIMARY KEY, 
  title TEXT,
  author TEXT,
  category TEXT,
  contentSnippet TEXT,
  preferredDistChannel TEXT,
  notes TEXT,
  status TEXT
);

-- Articles table
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  format TEXT,
  value TEXT,
  notes TEXT
);

-- Publication Options (One-to-One with Articles)
CREATE TABLE publicationOptions ( 
  id TEXT PRIMARY KEY, 
  title TEXT,
  pubDate TEXT, -- SQLite uses TEXT or INTEGER for dates
  webFeaturePreferred INTEGER, -- 0 or 1
  emailNewsletterPreferred INTEGER,
  subPortalPreferred INTEGER,
  blogFeaturePreferred INTEGER,
  reviewStatus TEXT,
  author TEXT,
  featured TEXT,
  access TEXT,
  editNotes TEXT,
  FOREIGN KEY (id) REFERENCES articles(id)
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY, 
  description TEXT,
  category TEXT,
  unit TEXT,
  price REAL, -- FLOAT is REAL in SQLite
  weight TEXT,
  color TEXT,
  details TEXT
);

-- Carts and Cart Items
CREATE TABLE carts (
  cartId TEXT PRIMARY KEY,
  sessionId TEXT
);

CREATE TABLE cartItems (
  cartId TEXT, 
  productId TEXT,
  quantity INTEGER,
  PRIMARY KEY (cartId, productId),
  FOREIGN KEY (cartId) REFERENCES carts(cartId) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Purchases and Billing
CREATE TABLE purchases (
  purchaseId TEXT PRIMARY KEY,
  sessionId TEXT
);

CREATE TABLE purchasedItems (
  purchaseId TEXT, 
  productId TEXT,
  quantity INTEGER,
  description TEXT,
  category TEXT,
  unit TEXT,
  price REAL,
  weight TEXT,
  color TEXT,
  details TEXT,
  PRIMARY KEY (purchaseId, productId),
  FOREIGN KEY (purchaseId) REFERENCES purchases(purchaseId)
);

CREATE TABLE billingInfo (
  billingId TEXT PRIMARY KEY,
  purchaseId TEXT,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zipCode TEXT,
  creditCardNum TEXT,
  expirationDate TEXT,
  securityCode TEXT,
  shippingDetails TEXT,
  FOREIGN KEY (purchaseId) REFERENCES purchases(purchaseId)
);

-- Return Requests
CREATE TABLE returnRequests (
  id TEXT PRIMARY KEY,
  sessionId TEXT,
  productDesc TEXT,
  price REAL,
  reason TEXT, 
  itemCondition TEXT,
  notes TEXT,
  status TEXT
);
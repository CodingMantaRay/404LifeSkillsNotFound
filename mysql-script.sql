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
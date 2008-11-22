
CREATE TABLE users(
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  groups   BLOB
);

CREATE TABLE rights(
  right    TEXT PRIMARY KEY,
  groups   TEXT
);

CREATE TABLE templates(
  name     TEXT PRIMARY KEY,
  json     BLOB
);

insert into users values ('sierk','sierk','all');

insert into rights values ('logout','.+');
insert into rights values ('login','.+');
insert into rights values ('jsoncontent.authenticate','.+');
insert into rights values ('jsoncontent.main','all');

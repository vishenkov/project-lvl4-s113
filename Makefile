install:  npm install

console:
	npm run gulp console

init:
	npm run gulp init

start:
	DEBUG="task-manager:*" npm run nodemon -- --watch src --ext '.js,.pug' --exec npm run gulp -- server

install-flow-typed:
	npm run flow-typed install

build:
	rm -rf dist
	npm run build

db:
	npm run gulp init
	npm run gulp gendbbase

gendb:
	npm rum gulp gendb

test:
	NODE_ENV=test npm test

check-types:
	npm run flow

lint:
	npm run eslint -- src __tests__

publish:
	npm publish

.PHONY: test

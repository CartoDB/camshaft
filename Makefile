all:
	npm install

clean:
	@rm -rf ./node_modules

jshint:
	@./node_modules/.bin/jshint lib/ test/

TEST_SUITE := $(shell find test/{integration,unit} -name "*.js")

MOCHA_TIMEOUT := 5000

test:
	./node_modules/.bin/mocha -u bdd -t $(MOCHA_TIMEOUT) test/setup.js $(TEST_SUITE) ${MOCHA_ARGS}

test-all: jshint test

coverage:
	./node_modules/.bin/istanbul cover node_modules/.bin/_mocha -- -u bdd -t $(MOCHA_TIMEOUT) $(TEST_SUITE)

.PHONY: test coverage

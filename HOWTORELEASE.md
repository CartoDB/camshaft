# How to release camshaft & camshaft reference

1. Execute the tests with `make clean all test`, fix if broken before proceeding.
2. Merge the patch or feature to master.
3. Increase the version in `package.json` [properly](http://semver.org/spec/v2.0.0.html)
4. Ensure `CHANGELOG.md` section exists for the new version, review it, and update release date.
5. In case the **public API** has some changes we need to release a new version of `camshaft-reference` too:
   1. Go to `reference/`, increase package.json version, and run `reference/tools/generate-reference`.
   2. Ensure new reference version is generated and package.json is updated.
6. Commit `package.json`, `CHANGELOG.md`, and reference files (if relevant).
7. Tag the release `git tag -a Major.Minor.Patch`, use CHANGELOG section as tag body.
8. Push it to the remote repository and wait for CI to run tests.
9. Go to the tag, `git checkout {{TAG}}`, and publish to the npm registry with `npm publish`.
10. If reference has changed, publish it to registry: `cd reference && npm publish && cd ..`.
11. Stub NEWS/package for next version.

Versions should follow http://semver.org/spec/v2.0.0.html.

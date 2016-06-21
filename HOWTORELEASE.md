# How to release camshaft & camshaft reference

1. Test (make clean all check), fix if broken before proceeding.
1. Merge patch, feature to master.
1. Ensure proper version in package.json.
1. Ensure NEWS.md section exists for the new version, review it, and update release date.
1. Go to `reference/`, update package.json version, and run `tools/generate-reference`.
1. Ensure new reference version is generated, package.json is updated.
1. Commit package.json, NEWS.md, and reference files.
1. Tag the release `git tag -a Major.Minor.Patch`, use NEWS section as content.
1. Push to remote repository and wait for CI to run tests.
1. Use the tag to publish to registry: `npm publish`.
1. Publish reference to registry: `cd reference && npm publish && cd ..`.
1. Stub NEWS/package for next version.

Versions should follow http://semver.org/spec/v2.0.0.html.

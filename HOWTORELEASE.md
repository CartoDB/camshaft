# How to release camshaft & camshaft reference

1. Test (make clean all check), fix if broken before proceeding.
2. Merge patch, feature to master.
3. Ensure proper version in package.json.
4. Ensure NEWS.md section exists for the new version, review it, add release date.
5. Commit package.json, NEWS.md.
6. git tag -a Major.Minor.Patch # use NEWS section as content.
7. npm publish to registry (first checkout to corresponding tag).
8. Go to `reference/` and run `tools/generate-reference`
9. Ensure new reference version is generated, package.json is updated
10. Commit new reference version.
11. Publish reference: `npm publish` to registry and back to project's path
12. Stub NEWS/package for next version.

Versions should follow http://semver.org/spec/v2.0.0.html.

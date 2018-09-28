# Set Custom GitHub Repo

If you want to set your own github repository as marketplace store site, the following fields should be configured as environment
variables under rest-server:

* `GITHUB_OWNER`: GitHub owner, default value is 'Microsoft' if not set here;
* `GITHUB_REPOSITORY`: Github repository, defalult value is 'pai' if not set here;
* `GITHUB_BRANCH`: Github branch, defalut value is 'master' if not set here. Note: Due to limitation described at https://developer.github.com/v3/search/#search-code, the branch that Marketplace backend tracks must be 'master' for now.
* `GITHUB_PATH`: Github path, default value is 'marketplace' if not set here.
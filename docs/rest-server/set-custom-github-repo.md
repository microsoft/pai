# Set Custom GitHub Repo

If you want to set your own github repository as marketplace store site, the following fields should be configured as environment
variables under rest-server:

* `GITHUB_OWNER`: GitHub owner, default value is 'Microsoft' if not set;
* `GITHUB_REPOSITORY`: Github repository, defalult value is 'pai' if not set;
* `GITHUB_PATH`: Github path, default value is 'marketplace' if not set here;
Note: The github branch must be 'master' for now since limitation described at https://developer.github.com/v3/search/#search-code.
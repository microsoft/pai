# Use Marketplace

1. [Quick Start](./quick-start.md)
2. [Docker Images and Job Examples](./docker-images-and-job-examples.md)
3. [How to Manage Data](./how-to-manage-data.md)
4. [How to Debug Jobs](./how-to-debug-jobs.md)
5. [Advanced Jobs](./advanced-jobs.md)
6. [Use Marketplace](./use-marketplace.md) (this document)
7. [Use VSCode Extension](./use-vscode-extension.md)
8. [Use Jupyter Notebook Extension](./use-jupyter-notebook-extension.md)

[OpenPAI Marketplace](https://github.com/microsoft/openpaimarketplace) can store job examples and templates. You can use marketplace to run-and-learn others' sharing jobs or share your own jobs.

If your administrator enables it, you will find a link in the `Plugin` section on webportal, like:

<img src="./imgs/marketplace-plugin.png" />

To use others' job templates on marketplace, you can click `Submit` directly, and it will bring you to the job submission page.

<img src="./imgs/marketplace-submit.png" />

To create a marketplace template, click the `Create` button on the page. As shown in the following picture, you can create the template from scratch, using an existing job yaml file on dist. You should fill in the template name, introduction and description.

<img src="./imgs/marketplace-create-new.png" />

Another approach is to use the yaml in one existing job of your own. Please note you can only create marketplace template from one `Succeeded` job. Jobs with other statuses are not allowed. No matter which approach, you should wait for your administrator's approval to make the template available on marketplace.
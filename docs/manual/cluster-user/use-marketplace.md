# Use Marketplace

[OpenPAI Marketplace](https://github.com/microsoft/openpaimarketplace) can store job examples and templates. You can use Marketplace to run-and-learn others' sharing jobs or share your jobs.

## Entrance

If your administrator enables marketplace plugin, you will find a link in the `Plugin` section on the webportal, like:

> If you are PAI admin, you could check [deployment doc](https://github.com/microsoft/openpaimarketplace/blob/master/docs/deployment.md) to see how to deploy and enable marketplace plugin.

![plugin](imgs/marketplace-plugin.png)

## Use Templates on Marketplace

The marketplace plugin has some official templates in the market list by default, to use the templates on Marketplace, you can click `Submit` directly, and it will bring you to the job submission page. Or you could click the `View` button to view the information about this template.

![submit](imgs/marketplace-submit.png)

## Create your Templates

To create a marketplace template, click the `Create` button on the page. As shown in the following picture, you could create the template from scratch with a config YAML file. You should fill in some necessary info like `name`, `introduction` and `description` etc. 

Another approach is creating from your existing job in the PAI platform. You can only create a Marketplace template from one `Succeeded` job. After creating, your templates will be awaiting review by the platform admin before you could see them in the market list.

![create](imgs/marketplace-create-new.png)

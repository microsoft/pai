## How to Config GitHub PAT
1. Login your account at [GitHub](https://github.com/) -> Click portrait at uppper right -> Click "Settings";

    ![GitHubPAT_Settings](./images/GitHubPAT1_Settings.png)
2. Click "Developer settings"  -> Click "Personal access tokens" -> Click "Generate new token";

    ![GitHubPAT_Generate](./images/GitHubPAT2_Generate.png)
3. Input "Token description" -> Select scopes at least with "repo/public_repo" -> Click "Generate token";

    ![GitHubPAT_Description_Scope](./images/GitHubPAT3_Scope.png)
4. Copy the new generated token;

    ![GitHubPAT_Copy](./images/GitHubPAT4_Copy.png)
5. Store GitHub PAT on PAI. Login PAI as admin -> Click "Administration" -> "User Management" -> "Edit" one user -> Paste token into Github PAT field -> Click "Update Github PAT" button;

    ![GitHubPAT_Paste](./images/GitHubPAT5_Paste.png)
# REST Server Extended API

Rest-server exposes some APIs under `/extend/` namespace. These APIs are mostly related to database, and are used as an extension of standard OpenPAI API.

## User Expression

User expression provides a basic key-value storage for user. Details are as follows.

A non-admin can only set/get/delete his own expressions. Meanwhile, an admin user can set/get/delete all users' expressions. If a user is not authorized, the following response is returned:

```json
Status: 401

{
  "code": "UnauthorizedUserError",
  "message": "You are not allowed to do this operation."
}
```


### `Create an expression for a certain user`

Please note:
  - One user cannot have expressions with duplicate keys. Thus, if the requested `key` is already created, we only update its value, instead of inserting a new expression.
  - Expression key should match `[a-zA-Z0-9_\-]+`.

*Request*

```json
PUT /api/extend/user/:username/expression
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "key": "<expression_key>",
  "value": "<expression_value>"
}
```


*Response if succeeded*

```json
Status: 201

{
  "message": "User expression is created successfully."
}
```

*Response if the key format doesn't match [a-zA-Z0-9_\\\-]+*

```json
Status: 400

{
    "code": "InvalidParametersError",
    "message": "<error message>"
}
```

### `Get an expression of a certain user`

*Request*

```json
GET /api/extend/:username/expression/:expressionName
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
  "id": <id>,
  "name": "<username>",
  "key": "<key>",
  "value": "value",
  "createdAt": "<timestamp for creation>",
  "updatedAt": "<timestamp for update>"
}
```

*Response if the expression is not found*

```json
Status: 404

{
    "code": "NoUserExpressionError",
    "message": "Expression <expressionName> of user <username> is not found."
}
```


### `Get all expressions of a certain user`

*Request*

```json
GET /api/extend/:username/expression
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

[{
  "id": <id>,
  "name": "<username>",
  "key": "<key>",
  "value": "value",
  "createdAt": "<timestamp for creation>",
  "updatedAt": "<timestamp for update>"
},
...
]
```


### `Delete an expression of a certain user`

*Request*

```json
DELETE /api/extend/:username/expression/:expressionName
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
    "message": "User expression is deleted successfully."
}
```

*Response if the expression is not found*

```json
Status: 404

{
    "code": "NoUserExpressionError",
    "message": "Expression <expressionName> of user <username> is not found."
}
```

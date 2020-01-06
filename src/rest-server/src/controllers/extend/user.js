// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// module dependencies
const {UserExpressionModel} = require('@pai/utils/extend/db');
const createError = require('@pai/utils/error');
const {userProperty} = require('@pai/config/token');
const NodeRSA = require('node-rsa');
const SSHPk = require('sshpk');
const {Sequelize} = require('sequelize');

const createUserExpression = async (req, res, next) => {
  try {
    const name = req.params.username;
    const key = req.body.key;
    const value = req.body.value;
    if ((req[userProperty].username !== name) && (!req[userProperty].admin) ) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }

    const foundItem = await UserExpressionModel.findOne({where: {name: name, key: key}});
    if (foundItem) {
      await UserExpressionModel.update(
        {name: name, key: key, value: value},
        {where: {name: name, key: key}}
      );
    } else {
      await UserExpressionModel.create(
        {name: name, key: key, value: value}
      );
    }
    return res.status(201).json({
      message: 'User expression is created successfully.',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};


const getAllUserExpression = async (req, res, next) => {
  try {
    if ((req[userProperty].username !== req.params.username) && (!req[userProperty].admin) ) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }
    const expressions = await UserExpressionModel.findAll(
      {where: {name: req.params.username}}
    );
    return res.status(200).json(expressions);
  } catch (error) {
    return next(createError.unknown(error));
  }
};


const getUserExpression = async (req, res, next) => {
  try {
    if ((req[userProperty].username !== req.params.username) && (!req[userProperty].admin) ) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }
    const expression = await UserExpressionModel.findOne(
      {where: {name: req.params.username, key: req.params.expressionName}}
    );
    if (!expression) {
      return next(createError('Not Found', 'NoUserExpressionError', `Expression ${req.params.expressionName} of user ${req.params.username} is not found.`));
    }
    return res.status(200).json(expression);
  } catch (error) {
    return next(createError.unknown(error));
  }
};


const deleteUserExpression = async (req, res, next) => {
  try {
    if ((req[userProperty].username !== req.params.username) && (!req[userProperty].admin) ) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }
    const expression = await UserExpressionModel.findOne(
      {where: {name: req.params.username, key: req.params.expressionName}}
    );
    if (!expression) {
      return next(createError('Not Found', 'NoUserExpressionError', `Expression ${req.params.expressionName} of user ${req.params.username} is not found.`));
    }
    await UserExpressionModel.destroy(
      {where: {name: req.params.username, key: req.params.expressionName}}
    );
    return res.status(200).json({
      message: 'User expression is deleted successfully.',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};


const generateSshKey = (username) => {
  const key = new NodeRSA({b: 1024});
  const pemPub = key.exportKey('pkcs1-public-pem');
  const pemPri = key.exportKey('pkcs1-private-pem');

  const sshKey = SSHPk.parseKey(pemPub, 'pem');
  sshKey.comment = `${username}@pai-system`;
  const sshPub = sshKey.toString('ssh');
  return [sshPub, pemPri];
};

const getUserSystemSshKey = async (req, res, next) => {
  try {
    if (req[userProperty].username !== req.params.username) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }

    let [publicKey, privateKey] = await Promise.all([
        UserExpressionModel.findOne({where: {name: req.params.username, key: 'ssh-key-system-public'}}),
        UserExpressionModel.findOne({where: {name: req.params.username, key: 'ssh-key-system-private'}}),
      ]);
    if (!(req.query && ('reset' in req.query) && (req.query.reset === 'true'))) {
      if (publicKey !== null && privateKey !== null) {
        return res.status(200).json({
          'public-key': publicKey.value,
          'private-key': privateKey.value,
        });
      }
    }
    if (publicKey !== null) {
await UserExpressionModel.destroy({where: {name: req.params.username, key: 'ssh-key-system-public'}});
}
    if (privateKey !== null) {
await UserExpressionModel.destroy({where: {name: req.params.username, key: 'ssh-key-system-private'}});
}
    [publicKey, privateKey] = generateSshKey(req.params.username);
    await UserExpressionModel.bulkCreate([
        {name: req.params.username, key: 'ssh-key-system-public', value: publicKey},
        {name: req.params.username, key: 'ssh-key-system-private', value: privateKey},
    ]);
    return res.status(200).json({
          'public-key': publicKey,
          'private-key': privateKey,
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const getUserCustomSshKey = async (req, res, next) => {
  try {
    if (req[userProperty].username !== req.params.username) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }
    const prefix = 'ssh-key-custom-public-';
    const expressions = await UserExpressionModel.findAll(
      {where: {name: req.params.username, key: {[Sequelize.Op.startsWith]: prefix}}});
    const jsonRes = expressions.reduce((jsonRes, {key, value, updatedAt}) => {
      jsonRes[key.substring(prefix.length)] = {
        'public-key': value,
        'updated-at': updatedAt,
      };
      return jsonRes;
    }, {});
    return res.status(200).json(jsonRes);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createUserCustomSshKey = async (req, res, next) => {
  try {
    if (req[userProperty].username !== req.params.username) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }
    const name = req.params.username;
    const key = `ssh-key-custom-public-${req.body.name}`;
    const value = req.body['public-key'];

    const foundItem = await UserExpressionModel.findOne({where: {name: name, key: key}});
    if (foundItem) {
      await UserExpressionModel.update(
        {name: name, key: key, value: value},
        {where: {name: name, key: key}}
      );
    } else {
      await UserExpressionModel.create(
        {name: name, key: key, value: value}
      );
    }
    return res.status(201).json({
      message: 'The public key is successfully set.',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const deleteUserCustomSshKey = async (req, res, next) => {
  try {
    if (req[userProperty].username !== req.params.username) {
      return next(createError('Unauthorized', 'UnauthorizedUserError', 'You are not allowed to do this operation.'));
    }
    const name = req.params.username;
    const key = `ssh-key-custom-public-${req.params.sshKeyName}`;

    const expression = await UserExpressionModel.findOne(
      {where: {name: name, key: key}}
    );
    if (!expression) {
      return next(createError('Not Found', 'NoSuchSshKeyError', `Custom SSH key ${key} of user ${name} is not found.`));
    }
    await UserExpressionModel.destroy(
      {where: {name: name, key: key}}
    );
    return res.status(200).json({
      message: 'User custom SSH key is deleted successfully.',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};


// module exports
module.exports = {
  createUserExpression,
  getAllUserExpression,
  getUserExpression,
  deleteUserExpression,
  getUserSystemSshKey,
  getUserCustomSshKey,
  createUserCustomSshKey,
  deleteUserCustomSshKey,
};

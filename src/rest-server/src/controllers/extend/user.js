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
const { UserExpressionModel } = require('@pai/utils/extend/db');
const createError = require('@pai/utils/error');

const createUserExpression = async (req, res, next) => {
  try {
    const name = req.params.username;
    const key = req.body.key;
    const value = req.body.value;
    const foundItem = await UserExpressionModel.findOne({ where: {name: name, key: key}});
    if (foundItem) {
      await UserExpressionModel.update(
        { name: name, key: key , value: value },
        { where: {name: name, key: key}}
      );
    }
    else {
      await UserExpressionModel.create(
        { name: name, key: key , value: value }
      );
    }
    return res.status(201).json({
      message: 'User expression is created successfully.',
    });
  } catch (error){
    return next(createError.unknown(error));
  }
}


const getAllUserExpression = async (req, res, next) => {
  try {
    const expressions = await UserExpressionModel.findAll(
      { where: { name: req.params.username }}
    );
    return res.status(200).json(expressions);
  } catch (error){
    return next(createError.unknown(error));
  }
}


const getUserExpression = async (req, res, next) => {
  try {
    const expression = await UserExpressionModel.findOne(
      { where: { name: req.params.username, key: req.params.expressionName }}
    )
    if (!expression) {
      return next(createError('Not Found', 'NoUserExpressionError', `Expression ${req.params.expressionName} of user ${req.params.username} is not found.`));
    }
    return res.status(200).json(expression);
  } catch (error){
    return next(createError.unknown(error));
  }
}


const deleteUserExpression = async (req, res, next) => {
  try {
    const expression = await UserExpressionModel.findOne(
      { where: { name: req.params.username, key: req.params.expressionName }}
    )
    if (!expression) {
      return next(createError('Not Found', 'NoUserExpressionError', `Expression ${req.params.expressionName} of user ${req.params.username} is not found.`));
    }
    await UserExpressionModel.destroy(
      { where: { name: req.params.username, key: req.params.expressionName }}
    )
    return res.status(200).json({
      message: 'User expression is deleted successfully.',
    });
  } catch (error){
    return next(createError.unknown(error));
  }
}


// module exports
module.exports = {
  createUserExpression,
  getAllUserExpression,
  getUserExpression,
  deleteUserExpression
};

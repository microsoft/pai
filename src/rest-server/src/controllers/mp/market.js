'use strict';
const marketEnv = require('@pai/config/mp/env-mp');
const fsAdaptor = require('@pai/utils/mp-storage');
const moduleRule = require('@pai/utils/moduleRuleParser');
const jsonSchemaUtil = require('@pai/utils/jsonSchemaUtil');
const util = require('util');
const createError = require('@pai/utils/error');
const getExampleDataPromise = util.promisify(fsAdaptor.readExampleDataFromFS);
const crypto = require('crypto');
const cacheAdptor = require('@pai/server');
const job = require('@pai/models/v2/job');
const {MTJob} = require('@pai/models/mp/job');
const logger = require('@pai/config/logger');
const apiGateways = require('@pai/config/api-gateway');
const {getGenericInfoByName} = require('@pai/models/v2/job/merged');

let mpEnvDict = marketEnv.parseIni();

let moduleJasonSchemaCache = {};

const getModuleListMetadataFromCache = async (req, res, next) => {
    let cacheContent = cacheAdptor.getModuleCacheContent();
    return res.status(200).json({'moduleList': cacheContent});
};

const getJsonSchema = async (req, res, next) => {
    let moduleId = req.params.moduleId;

    if (moduleJasonSchemaCache.hasOwnProperty(moduleId)) {
        return res.status(200).json(moduleJasonSchemaCache[moduleId]);
    }
    // not hit the cache, like rest-server restart.
    fsAdaptor.readModuleDataFromFS('mtpkrbrs', moduleId, function(err, ret) {
        if (err) {
            return next(createError('Internal Server Error', 'UnknownError', err));
        } else {
            let jsonContent = ret;
            let paras = {};
            // parse json Content
            if (jsonContent.hasOwnProperty('info')) {
                try {
                    let interfaceStr = ret.info.match(/i=".*?"/).toString().slice(3, -1);
                    paras = moduleRule.moduleRuleParser(interfaceStr);
                } catch (err) {
                    logger.error(err);
                    return next(createError('Internal Server Error', 'UnknownError', err));
                }
            }
            if (jsonContent.hasOwnProperty('detail')) {
                paras = moduleRule.mergeModuleParameters(paras, JSON.parse(jsonContent.detail).parameters);
            }
            let jsonSchemaContent = jsonSchemaUtil.getJsonSchemaContent(paras);
            moduleJasonSchemaCache[moduleId] = jsonSchemaContent;
            return res.status(200).json(jsonSchemaContent);
        }
    });
};

const getExampleListFromCache = async (req, res, next) => {
    let cacheContent = cacheAdptor.getExampleCacheContent();
    return res.status(200).json({'data': cacheContent});
};

/**
 * get module information, TODO: refactor
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getInfo = async (req, res, next) => {
    let needJsonSchema = false;
    if (req.query.hasOwnProperty('schema') && req.query['schema'] === 'json') {
        needJsonSchema = true;
    }

    let userName = req.user.username;
    let moduleId = req.params.moduleId;
    fsAdaptor.readModuleDataFromFS(userName, moduleId, function(err, ret) {
        if (err) {
            return next(createError('Bad Request', 'UnknownError', err));
        } else {
            let jsonContent = ret;
            let paras = {};
            // parse json Content
            if (jsonContent.hasOwnProperty('info')) {
                try {
                    let interfaceStr = ret.info.match(/i=".*?"/).toString().slice(3, -1);
                    paras = moduleRule.moduleRuleParser(interfaceStr);
                } catch (err) {
                    logger.error(err);
                    return next(createError('Internal Server Error', 'UnknownError', err));
                }
            }
            if (jsonContent.hasOwnProperty('detail')) {
                paras = moduleRule.mergeModuleParameters(paras, JSON.parse(jsonContent.detail).parameters);
            }
            if (needJsonSchema) {
                let jsonSchemaLink = `${apiGateways.LoginServer}/api/v2/mp/modules/${moduleId}/jsonSchema`;
                paras['$schema'] = {'default': jsonSchemaLink};
                jsonContent['$schema'] = jsonSchemaLink;
            }
            jsonContent['parameters'] = paras;

            return res.status(200).json(jsonContent);
        }
    });
};

/**
 * get example information
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getExampleInfo = async (req, res, next) => {
    let userName = req.user.username;
    let exampleId = req.params.exampleId;

    fsAdaptor.readExampleDataFromFS(userName, exampleId, async (err, ret) => {
        if (err) {
            return next(createError('Bad Request', 'UnknownError', err));
        } else {
            return res.status(200).json(ret);
        }
    });
};

/**
 * Generate a unique id by the name parameters and timestamp
 * @param {*} userName
 * @param {*} name
 * @param {*} purifiedName
 */
function generateUniqueId(userName, name, purifiedName) {
    let curtime = new Date();
    let realMonth = curtime.getMonth()+1;
    let ts = curtime.getFullYear() + '-' + realMonth + '-' + curtime.getDate() + '-' + curtime.getHours() + '-' + curtime.getMinutes() + '-' + curtime.getSeconds();
    let uniqueId = userName + name + purifiedName + ts + curtime.getMilliseconds() + Math.random();
    let hash = crypto.createHash('sha512');
    hash.update(uniqueId);
    return hash.digest('hex');
}

/**
 * set example data
 * @param {*} mode updata || create
 * @param {*} req request data
 * @param {*} res
 * @param {*} next
 */
async function setExample(mode, req, res, next) {
    let userName = req.user.username;
    let moduleId = req.body.info.moduleId;
    let mpEnvDict = marketEnv.parseIni();
    let hdfsUser = mpEnvDict['HDFS_USER'];
    // validate module id
    fsAdaptor.listModuleDir(hdfsUser, async (ret) => {
        if (ret.hasOwnProperty('err')) {
            return next(createError('Bad Request', 'InvalidParametersError', ret));
        } else {
            let moduleList = JSON.parse(ret.info).FileStatuses.FileStatus;
            let moduleIdValid = false;
            for (let i = 0; i < moduleList.length; i++) {
                if (moduleList[i].pathSuffix === moduleId) {
                    moduleIdValid = true;
                    break;
                }
            }
            if (!moduleIdValid) {
                return next(createError('Bad Request', 'InvalidParametersError', `moduleId ${moduleId} is not valid!`));
            }
            let exampleId = mode === 'update'? req.params.exampleId : `example-${userName}-${generateUniqueId(userName, '', '')}`;
            if (mode === 'create') {
                // validate example id
                fsAdaptor.listExampleDir(hdfsUser, async (ret) => {
                    if (ret.hasOwnProperty('err')) {
                        return next(createError('Bad Request', 'InvalidParametersError', ret));
                    } else {
                        let exampleList = JSON.parse(ret.info).FileStatuses.FileStatus;
                        for (let i = 0; i < exampleList.length; i++) {
                            if (exampleList[i].pathSuffix === exampleId) {
                                if (mode === 'create') {
                                    // If the mode is 'create', exampleId should be unique
                                    return next(createError('Bad Request', 'InvalidParametersError', `exampleId ${exampleId} is not valid!`));
                                }
                            }
                        }
                    }
                });
            } else {
                // user authentication
                let infoJson=JSON.parse(await getExampleDataPromise(hdfsUser, exampleId));
                if (infoJson.hasOwnProperty('RemoteException')) {
                    return next(createError('Bad Request', 'InvalidParametersError', `exampleId ${exampleId} does not exist!`));
                }
                let exampleOwner = infoJson.info['owner'];
                if (exampleOwner !== userName) {
                    return next(createError('Bad Request', 'UnauthorizedUserError', `User authentication Error!\n\
                                Only user ${exampleOwner} has permission to update this example, your alias is ${userName}`));
                }
            }
            req.body.info['id'] = exampleId;
            fsAdaptor.writeFileToFs(hdfsUser, mpEnvDict['EXAMPLES_DIR'], exampleId, JSON.stringify(req.body), (ret) => {
                cacheAdptor.updateExampleCache(exampleId, ()=>{
                    return res.status(200).json({'result': ret});
                });
            });
        }
    });
}

/**
 * update existing example data
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const postUpdateExample = async (req, res, next) => {
    return await setExample('update', req, res, next);
};

/**
 * create a new example
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const postCreateExample = async (req, res, next) => {
    return await setExample('create', req, res, next);
};

/**
 * delete an example
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteExample = async (req, res, next) => {
    let userName = req.user.username;
    let exampleId = req.params.exampleId;

    // user authentication
    let infoJson=JSON.parse(await getExampleDataPromise(userName, exampleId));
    if (infoJson.hasOwnProperty('RemoteException')) {
        return next(createError('Bad Request', 'InvalidParametersError', `exampleId ${exampleId} does not exist!`));
    }
    let exampleOwner = infoJson.info['owner'];
    if (exampleOwner !== userName) {
        return next(createError('Bad Request', 'UnauthorizedUserError', `User authentication Error!\n\
                    Only user ${exampleOwner} has permission to delete this example, your alias is ${userName}`));
    }
    fsAdaptor.deleteFileFromFS(userName, `${mpEnvDict['EXAMPLES_DIR']}${exampleId}`, (err, ret) => {
        cacheAdptor.updateExampleCache(exampleId, ()=>{
            return res.status(200).json({'result': ret});
        });
    });
};

const getUserHomeDir = async (req, res, next) => {
    let userName = req.user.username;
    res.status(200).json({'homeDir': `/user/${userName}/MP/cache`});
};

function getIgnoreCase(obj, key) {
    for (let o in obj) {
        if (o.toLowerCase() === key.toLowerCase() ) {
            return obj[o];
        }
    }
    return null;
}

const submitJob = async (req, res, next) => {
    let userName = req.user.username;
    let moduleId = getIgnoreCase(req.body, 'ModuleId');
    let moduleParams = getIgnoreCase(req.body, 'Parameters');
    let frameworkName = getIgnoreCase(req.body, 'FrameworkName'); // This may be undefined. Use job.frameworkName in result object
    let jobGroupId = getIgnoreCase(req.body, 'JobGroupId'); // This may be undefined.

    try {
        let job = MTJob.create(userName, moduleId, frameworkName, jobGroupId);
        let result = await job.submit(moduleParams);
        result.frameworkName = job.jobName;
        result.webportalLink = job.webportalLink;
        // Manually refresh jobwrapper info
        getGenericInfoByName(job.serviceFrameworkName).catch((err) => {
            logger.warn(`Failed to refresh jobwrapper [${job.serviceFrameworkName}]`);
        });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const listMergedJobs = async (req, res) => {
    const data = await job.listMergedJobs(req.query);
    res.json(data);
};

module.exports = {
    getInfo,
    submitJob,
    getModuleListMetadataFromCache,
    getExampleListFromCache,
    postCreateExample,
    postUpdateExample,
    deleteExample,
    getExampleInfo,
    getUserHomeDir,
    listMergedJobs,
    getJsonSchema,
};

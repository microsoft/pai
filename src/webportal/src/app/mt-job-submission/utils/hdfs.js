import * as webportalConfig from '../../config/webportal.config';
import * as axios from 'axios';
import {getClientsForSubcluster} from '../../common/http-client';
import {getSubclusterConfigByName} from '../../common/subcluster';

class HDFSClient {
    constructor(axiosClient, user, pathPrefix) {
        this.axiosClient = axiosClient;
        this.user = user;
        this.pathPrefix = pathPrefix;
    }

    /**
     * 
     * @param {string} hdfsPath Directory path. Starts with '/'.
     * @param {string} permission Octal file permission like '755'
     */
    async mkdir(hdfsPath, permission='755') {
        let resp = await this.axiosClient.put(`${this.pathPrefix}${hdfsPath}`, undefined, {
            params: {
                op: 'MKDIRS',
                permission: permission,
                'user.name': this.user,
            }
        });
        if (resp.data.boolean === false) {
            throw new Error(`Mkdir ${hdfsPath} failed`);
        }
    }

    /**
     * 
     * @param {string} hdfsPath File path. Starts with '/'.
     * @param {File} file A file object
     */
    async uploadFile(hdfsPath, file, permission='644', overwrite=true) {
        // There are two steps to upload a file to webhdfs using webhdfs rest api. 1. Create file 2. Write content
        // First step: Create file
        let createResp = await this.axiosClient.put(this.pathPrefix + hdfsPath, undefined, {
            params: {
                op: 'CREATE',
                permission: permission,
                overwrite: overwrite,
                noredirect: true,
                'user.name': this.user,
            }
        }); // Might throw 500 error if file exists and overwrite=false
        // Second step: Write content
        let writeClient = axios.create();
        // 1. Unable to use "useProxy" interceptors here because Axios will will combine baseURL with URL if URL is a complete URL
        // 2. According to axios docs, it's legal to put FileObject directly.
        await writeClient.put(`${webportalConfig.cacheUri}/${createResp.data.Location}`, file, {
            headers: {
                'Content-Type': 'application/octet-stream',
            }
        });
    }
}

function getHDFSClient(user, subclusterName) {
    let subclusteConfig = getSubclusterConfigByName(subclusterName);
    if (webportalConfig.fileUploadMethod === 'WEBHDFS') {
        let axiosClient = axios.create({
            baseURL: subclusteConfig.hdfsUri.replace('hdfs://', 'http://'),
        });
        axiosClient.interceptors.request.use(useProxy);
        return new HDFSClient(axiosClient, user, '/webhdfs/v1');
    } else if (webportalConfig.fileUploadMethod === 'HTTPFS') {
        let axiosClient = getClientsForSubcluster(subclusterName).httpFSClient;
        return new HDFSClient(axiosClient, user, subclusteConfig.HttpFSAPIPath);
    } else {
        throw new Error(`FILE UPLOAD METHOD: ${webportalConfig.fileUploadMethod} is not supported!`);
    }
}

export {
    getHDFSClient,
}
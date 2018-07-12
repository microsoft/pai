

const appRoot = require('app-root-path');
const path = require('path');

const yaml = require('js-yaml');
const fs = require('fs');
const basePath = path.join(appRoot.path, 'marketplace');

// parse the json data to template summary format.
const to_template_summary = (data) =>{
    let res = { 'datasets': [], 'scripts': [], 'dockers': [], };
    if ('job' in data) {
        let d = data['job'];
        res['name'] = d['name'];
        res['type'] = 'job';
        res['version'] = d['version'];
        res['contributors'] = [d['contributor']]; // todo split the contributor string?    
        res['description'] = d['description'];
    }
    if ('prerequisites' in data) {
        Object.keys(data['prerequisites']).forEach(function (key) {
            let d = data['prerequisites'][key];
            let item = {
                'name': d['name'],
                'version': d['version']
            };
            switch (d['type']) {
                case "data":
                    res['datasets'].push(item);
                    break;
                case "script":
                    res['scripts'].push(item);
                    break;
                case "dockerimage":
                    res['dockers'].push(item);
                    break;
            }
        })
    }
    return res;
};

const list = (req, res) => {
    let templateList = []
    fs.readdirSync(basePath).forEach(filename => {
        templateList.push(to_template_summary(yaml.safeLoad(fs.readFileSync(`${basePath}/${filename}`, 'utf8'))));
    });
    return res.status(200).json(templateList);
};

const recommend = (req, res) => {
    let count = req.param('count', 3);
    let filenames = fs.readdirSync(basePath);
    if (count > filenames.length){
        return res.status(404).json({
            'message': 'The value of the "count" parameter must be less than the number of templates',
        });
    }
    else {
        let templateList = [];
        for (let i = 0; i < count; ++i)
            templateList.push(to_template_summary(yaml.safeLoad(fs.readFileSync(`${basePath}/${filenames[i]}`, 'utf8'))));
        return res.status(200).json(templateList);
    }
};


const get_template_by_name_and_version = (req, res) =>{
    let name = req.param('name');
    let version = req.param('version');

    let filenames = fs.readdirSync(basePath);
    for (let i = 0; i < filenames.length; ++i){
        let data = yaml.safeLoad(fs.readFileSync(`${basePath}/${filenames[i]}`, 'utf8'));
        if ('job' in data) {
            let d = data['job'];
            if(d['name'] == name && d['version'] == version){
                return res.status(200).json(data);
            }
        }
    }
    return res.status(404).json({
        'message': 'Not Found',
    });
}


module.exports = { 
    list,
    recommend,
    get_template_by_name_and_version
};
const appRoot = require('app-root-path');
const path = require('path');

const yaml = require('js-yaml');
const fs = require('fs');
const basePath = path.join(appRoot.path, 'marketplace');

// parse the json data to template summary format.
const to_template_summary = (data) =>{
    res = { 'datasets': [], 'scripts': [], 'dockers': [], }
    if ('job' in data) {
        //console.log('in');       
        var d = data['job'];
        res['name'] = d['name'];
        res['type'] = 'job';
        res['version'] = d['version'];
        res['contributors'] = [d['contributor']]; // todo split the contributor string?    
        res['description'] = d['description'];
    }
    if ('prerequisites' in data) {
        Object.keys(data['prerequisites']).forEach(function (key) {
            var d = data['prerequisites'][key];
            var item = {
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
    var templateList = []
    fs.readdirSync(basePath).forEach(filename => {
        templateList.push(to_template_summary(yaml.safeLoad(fs.readFileSync(`${basePath}/${filename}`, 'utf8'))));
    });
    return res.status(200).json(templateList);
};

const recommend = (req, res) => {
    var count = req.param('count', 3);
    var filenames = fs.readdirSync(basePath);
    if (count > filenames.length){
        return res.status(404).json({
            'message': 'The value of the "count" parameter must be less than the number of templates',
        });
    }
    else {
        var templateList = [];
        for (var i = 0; i < count; ++i)
            templateList.push(to_template_summary(yaml.safeLoad(fs.readFileSync(`${basePath}/` + filenames[i], 'utf8'))));
        return res.status(200).json(templateList);
    }
};

module.exports = { 
    list,
    recommend
};
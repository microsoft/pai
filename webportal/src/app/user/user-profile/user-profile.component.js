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
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const userProfileComponent = require('./user-profile.component.ejs');
const detailExperimentComponent = require('../../marketplace/template-view/detail-experiment.component.ejs');
require('./user-profile.component.scss');

const recentlyData = [
  {
    name: 'tensorflow_cnnbenc',
    avatar: '/assets/img/script.png',
    contributor: 'Jake',
    star: 5,
    downloads: '67,000'
  },
  {
    name: 'tf_serving_example',
    avatar: '/assets/img/dockerimage.png',
    contributor: 'Shawn',
    star: 4,
    downloads: '62,000'
  },
  {
    name: 'spacev_config',
    avatar: '/assets/img/data.png',
    contributor: 'Aimore',
    star: 5,
    downloads: '28,000'
  },
  {
    name: 'cifar10',
    avatar: '/assets/img/data.png',
    contributor: 'slashele',
    star: 5,
    downloads: '60,000'
  },
  {
    name: 'pytorch_examples',
    avatar: '/assets/img/script.png',
    contributor: 'Jesus',
    star: 5,
    downloads: '57,000'
  }
];

const myAssestData = [
  // data
  {
    name: 'cifar10',
    author: 'Santiago Bazan',
    description: 'cifar10 dataset, image',
    image: '/assets/img/data.png'
  },
  // docker
  {
    name: 'tf_serving_example',
    author: 'hong Le',
    description: 'python3.5, tensorflow',
    image: '/assets/img/dockerimage.png'
  },
  // job
  {
    name: 'spacev_vectorsearch',
    author: 'Mahmoud Farahat',
    description: 'for example: 3',
    image: '/assets/img/job.png'

  },
  // docker
  {
    name: 'spacev_example',
    author: 'Jesus Garcia',
    description: 'spacev',
    image: '/assets/img/dockerimage.png'
  }
];

const experimentData = [
  {
    name: 'FaceNet on Pigs',
    type: 'BATCH',
    duration: '10h 41m 15s',
    time: '7/25/2018 3:51:04 PM',
    status: 'RUNNING',
    number: [3, 0],
    visualization: '/assets/img/loss_acc_per_Model.png',
  },
  {
    name: 'ImageNet Benchmark',
    type: 'BATCH',
    duration: '15h 12m 5s',
    time: '6/28/2018 3:51:04 PM',
    status: 'SUCCEEDED',
    number: [2, 0],
    visualization: '/assets/img/loss_acc_per_DataSet.png',
  },
];

const userProfileHtml = userProfileComponent({
  breadcrumb: breadcrumbComponent,
  recentData: recentlyData,
  assetData: myAssestData,
  experiment: detailExperimentComponent,
  experimentData: experimentData,
});

$('#content-wrapper').html(userProfileHtml);
